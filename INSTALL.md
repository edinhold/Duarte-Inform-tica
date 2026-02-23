
# 🚀 Guia de Implantação Profissional - Duarte Delivery (Apache Edition)

Este guia detalha como configurar o sistema em um servidor de produção (VPS) utilizando **Apache** e como gerar os aplicativos móveis.

---

## 1. Configuração da VPS (Linux Ubuntu 22.04+)

Recomendamos o uso da **LAMP Stack** (Linux, Apache, MySQL, PHP).

### A. Preparação do Ambiente
```bash
sudo apt update && sudo apt upgrade -y
# Instalação do Apache, PHP e módulos necessários
sudo apt install apache2 php libapache2-mod-php php-mysql php-curl php-gd php-mbstring git curl unzip -y
```

### B. Habilitar Módulos do Apache
O sistema precisa do módulo de reescrita para rotas amigáveis (SPA) e cabeçalhos.
```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

### C. Configuração do VirtualHost
Edite o arquivo de configuração do site: `sudo nano /etc/apache2/sites-available/duarte.conf`

```apache
<VirtualHost *:80>
    ServerName seu-dominio.com
    DocumentRoot /var/www/duarte

    <Directory /var/www/duarte>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Configurações de Logs
    ErrorLog ${APACHE_LOG_DIR}/duarte_error.log
    CustomLog ${APACHE_LOG_DIR}/duarte_access.log combined

    # Segurança: Bloquear acesso a arquivos sensíveis
    <FilesMatch "^\.env|^\.htaccess|.*\.log$">
        Require all denied
    </FilesMatch>
</VirtualHost>
```
Ative o site:
```bash
sudo a2ensite duarte.conf
sudo a2dissite 000-default.conf
sudo systemctl reload apache2
```

### D. Configuração do .htaccess (Raiz do Projeto)
Crie um arquivo `.htaccess` na pasta `/var/www/duarte` para garantir que o React trate as rotas:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### E. SSL (HTTPS Obrigatório)
```bash
sudo apt install certbot python3-certbot-apache -y
sudo certbot --apache -d seu-dominio.com
```

---

## 2. Criação dos Aplicativos (Android & iOS)

Utilizamos o **Capacitor** para transformar a Web em App Nativo.

### A. build do Projeto
```bash
npm run build
```

### B. Inicialização do Capacitor
1. `npx cap init "Duarte Delivery" "com.duarte.delivery" --web-dir dist`
2. `npx cap add android`
3. `npx cap add ios`

### C. Permissões Nativas
No Android (`AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.CAMERA" />
```

---

## 3. Segurança e PHP API

- **Pasta da API:** Sugerimos criar `/var/www/duarte/api/` e colocar seus scripts PHP lá.
- **Conexão DB:** No Apache com `libapache2-mod-php`, o PHP roda como o usuário `www-data`.
- **Permissões:** 
  ```bash
  sudo chown -R www-data:www-data /var/www/duarte
  sudo chmod -R 755 /var/www/duarte
  ```

---
**Suporte:** Em caso de erro 404 ao atualizar a página, certifique-se de que o `AllowOverride All` está configurado corretamente no seu VirtualHost do Apache para permitir que o `.htaccess` funcione.
