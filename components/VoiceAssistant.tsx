
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ isOpen, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Pronto para falar');
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    try {
      setStatus('Conectando...');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('Ouvindo...');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContextRef.current.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopSession(),
          onerror: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'Você é um assistente de voz do Duarte Delivery. Ajude o usuário a navegar no app, fazer pedidos ou tirar dúvidas de entrega de forma amigável e eficiente.'
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('Erro ao conectar');
    }
  };

  const stopSession = () => {
    sessionRef.current?.close();
    setIsActive(false);
    setStatus('Pronto para falar');
    sourcesRef.current.forEach(s => s.stop());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-md z-[150] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 text-center space-y-8 shadow-2xl animate-in zoom-in duration-300 border border-indigo-100">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Duarte Voice</span>
          <button onClick={onClose} className="text-indigo-200 hover:text-indigo-900 transition-colors">✕</button>
        </div>
        
        <div className="relative flex justify-center py-10">
          <div className={`absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse ${isActive ? 'scale-150' : 'scale-0'}`}></div>
          <button 
            onClick={isActive ? stopSession : startSession}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl ${isActive ? 'bg-red-500 scale-110' : 'bg-indigo-600 hover:scale-105 shadow-indigo-200'}`}
          >
            {isActive ? (
              <div className="flex gap-1">
                <div className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="w-1.5 h-10 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            )}
          </button>
        </div>

        <div>
          <h3 className="text-2xl font-black text-indigo-950 mb-2">{status}</h3>
          <p className="text-sm text-indigo-400 font-medium">Toque para conversar com a Duarte Voice em tempo real.</p>
        </div>

        <div className="bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100">
           <p className="text-xs font-bold text-indigo-600 mb-1">Dica:</p>
           <p className="text-[10px] text-indigo-400 italic">"Duarte, onde está minha entrega?" ou "Verifique o status do pedido #123"</p>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
