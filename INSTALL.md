# 🚀 Guia de Instalação VPS - Delivora Delivery System

Este documento fornece instruções detalhadas para implantar o sistema **Delivora** em um servidor Linux (VPS).

## 1. Requisitos do Sistema
- **SO:** Ubuntu 22.04 LTS ou superior (recomendado).
- **Recursos Mínimos:** 1GB RAM, 1 vCPU.
- **Domínio:** Um domínio ou subdomínio apontado para o IP do servidor (necessário para HTTPS).
- **Acesso:** Usuário com privilégios `sudo`.

---

## 2. Preparação do Servidor

Atualize os pacotes do sistema e instale o **Nginx**:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nginx git curl -y
```

---

## 3. Implantação dos Arquivos

Crie o diretório do projeto e copie os arquivos da aplicação:

```bash
sudo mkdir -p /var/www/delivora
# Se estiver usando Git:
# sudo git clone https://seu-repositorio.com/delivora.git /var/www/delivora
```

Certifique-se de que as permissões de pasta estão corretas para o Nginx:

```bash
sudo chown -R www-data:www-data /var/www/delivora
sudo chmod -R 755 /var/www/delivora
```

---

## 4. Configuração da API Key (Gemini)

Como a aplicação é baseada em módulos ES6 rodando no browser, a `process.env.API_KEY` precisa ser resolvida. Em um ambiente de produção VPS, você tem duas opções:

1.  **Injeção via Build Tool:** Se estiver usando Vite/Webpack, utilize um arquivo `.env`.
2.  **Injeção Manual:** No arquivo `index.html` ou em um script de inicialização, defina a variável global antes do carregamento do `index.tsx`:
    ```html
    <script>
      window.process = { env: { API_KEY: 'SUA_CHAVE_AQUI' } };
    </script>
    ```

> ⚠️ **Segurança:** Para produção rigorosa, recomenda-se criar um Proxy reverso simples em PHP ou Node.js para ocultar a chave de API do lado do cliente.

---

## 5. Configuração do Nginx

Crie um novo arquivo de configuração para o site:

```bash
sudo nano /etc/nginx/sites-available/delivora
```

Cole a seguinte configuração (substituindo `seu-dominio.com`):

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /var/www/delivora;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Segurança
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}
```

Ative o site e reinicie o Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/delivora /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. Segurança e SSL (HTTPS)

O Delivora requer HTTPS para funcionar o **Radar de Localização (GPS)** e o **Assistente de Voz (Microfone)**. Utilize o Certbot para instalar um certificado gratuito:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seu-dominio.com
```

Siga as instruções na tela para completar o desafio do Let's Encrypt. O Certbot configurará automaticamente o redirecionamento de HTTP para HTTPS.

---

## 7. Manutenção e Logs

Para verificar erros no servidor:
- **Logs de Erro:** `sudo tail -f /var/log/nginx/error.log`
- **Logs de Acesso:** `sudo tail -f /var/log/nginx/access.log`

---

## 8. Notas sobre PHP
Caso deseje integrar um backend em **PHP** para persistência de dados real (em vez do estado em memória atual):
1. Instale o PHP-FPM: `sudo apt install php-fpm php-mysql`.
2. Atualize o bloco `location` do Nginx para processar arquivos `.php` via fastcgi.
3. Utilize os arquivos `.php` para endpoints de API que o `index.tsx` possa consumir via `fetch()`.
