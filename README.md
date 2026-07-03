# Setup Web Server + DNS + SSL Self-Signed di Ubuntu Server VMware

Dokumentasi ini menjelaskan konfigurasi dari awal untuk membuat **Ubuntu Server di VMware** menjadi:

- Web server Apache2
- DNS server BIND9
- HTTPS menggunakan self-signed SSL certificate
- Domain lokal `aliusman.com`
- Bisa diakses dari Linux client dan Windows client

Contoh konfigurasi yang digunakan:

| Item | Value |
|---|---|
| Domain | `aliusman.com` |
| Alias | `www.aliusman.com` |
| Nameserver | `ns1.aliusman.com` |
| IP Ubuntu Server VM | `172.16.141.129` |
| Subnet | `172.16.141.0/24` |
| Webroot | `/var/www/html/aliusman.com` |
| Web Server | Apache2 |
| DNS Server | BIND9 |
| SSL | Self-signed |

> Sesuaikan IP, gateway, interface, dan subnet dengan jaringan VMware kamu.

---

## 1. Topologi Lab VMware

Contoh topologi:

```text
+----------------------+        +-------------------------+
| Linux / Windows Host |        | Ubuntu Server VM         |
| Browser Client       | <----> | Apache + BIND9 + SSL     |
| DNS: 172.16.141.129  |        | IP: 172.16.141.129       |
+----------------------+        +-------------------------+
              VMware Network: Bridged / Host-Only / NAT
```

Untuk lab DNS dan webserver lokal, mode jaringan yang paling mudah:

| VMware Network Mode | Keterangan | Rekomendasi |
|---|---|---|
| Bridged | VM berada satu jaringan dengan host dan perangkat LAN lain | Direkomendasikan jika ingin diakses dari host dan device lain satu jaringan |
| Host-Only | Hanya bisa diakses dari host dan VM lain pada jaringan host-only | Bagus untuk lab offline |
| NAT | VM keluar internet lewat host, akses dari LAN lain terbatas | Bisa dipakai, tapi perlu port forwarding jika diakses dari luar host |

Rekomendasi untuk kasus ini: gunakan **Bridged** atau **Host-Only**.

---

## 2. Setup Network Adapter di VMware

### Opsi A — Bridged Adapter

Gunakan ini jika ingin Ubuntu Server VM bisa diakses dari laptop/PC host dan perangkat lain satu jaringan.

Langkah:

1. Shutdown Ubuntu Server VM.
2. Buka **VMware Settings**.
3. Pilih **Network Adapter**.
4. Pilih **Bridged: Connected directly to the physical network**.
5. Centang **Replicate physical network connection state** jika tersedia.
6. Start VM.

Pastikan IP statik `172.16.141.129` memang berada dalam subnet jaringan bridged kamu.

### Opsi B — Host-Only Adapter

Gunakan ini jika hanya ingin akses dari host ke VM.

Langkah:

1. Shutdown Ubuntu Server VM.
2. Buka **VMware Settings**.
3. Pilih **Network Adapter**.
4. Pilih **Host-only**.
5. Start VM.
6. Pastikan IP server mengikuti subnet VMnet host-only.

Contoh jika VMnet host-only adalah `172.16.141.0/24`, maka server boleh memakai:

```text
IP      : 172.16.141.129
Netmask : 255.255.255.0
Gateway : kosong atau gateway VMnet host-only jika ada
DNS     : 172.16.141.129
```

### Opsi C — NAT Adapter

Gunakan NAT jika VM tetap perlu internet, tetapi akses dari luar host tidak prioritas.

Cek subnet NAT VMware. Biasanya berbeda, misalnya `192.168.x.0/24` atau `172.16.x.0/24`.

Di Windows host:

```cmd
ipconfig
```

Cari adapter:

```text
VMware Network Adapter VMnet8
```

Di Linux host:

```bash
ip addr
ip route
```

Cari interface VMware seperti `vmnet8`.

Jika NAT subnet bukan `172.16.141.0/24`, ganti semua IP di README ini sesuai subnet NAT kamu.

---

## 3. Cek IP, Gateway, dan Interface di Ubuntu Server VM

Login ke Ubuntu Server VM lalu cek interface:

```bash
ip a
```

Contoh nama interface:

```text
ens33
enp0s3
eth0
```

Cek gateway:

```bash
ip route
```

Contoh output:

```text
default via 172.16.141.1 dev ens33
```

Berarti:

```text
Interface : ens33
Gateway   : 172.16.141.1
Subnet    : 172.16.141.0/24
```

---

## 4. Setup Static IP di Ubuntu Server VM

Cek file netplan:

```bash
ls /etc/netplan/
```

Contoh file:

```text
00-installer-config.yaml
```

Backup dulu:

```bash
sudo cp /etc/netplan/00-installer-config.yaml /etc/netplan/00-installer-config.yaml.bak
```

Edit netplan:

```bash
sudo nano /etc/netplan/00-installer-config.yaml
```

Contoh konfigurasi untuk interface `ens33`:

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    ens33:
      dhcp4: false
      addresses:
        - 172.16.141.129/24
      routes:
        - to: default
          via: 172.16.141.1
      nameservers:
        addresses:
          - 172.16.141.129
          - 8.8.8.8
```

> Ganti `ens33` dan `172.16.141.1` sesuai interface dan gateway kamu.

Apply konfigurasi:

```bash
sudo netplan apply
```

Cek hasil:

```bash
ip a
ip route
```

Test koneksi internet:

```bash
ping -c 4 8.8.8.8
ping -c 4 google.com
```

Jika `ping 8.8.8.8` berhasil tetapi `ping google.com` gagal, berarti DNS resolver belum benar.

---

## 5. Setup Dependencies

Update repository:

```bash
sudo apt update
sudo apt upgrade -y
```

Install Apache, BIND9, OpenSSL, DNS tools, dan UFW:

```bash
sudo apt install apache2 bind9 bind9utils dnsutils openssl ufw -y
```

Enable service:

```bash
sudo systemctl enable apache2
sudo systemctl enable bind9
```

---

## 6. Setup Hostname dan Hosts File Server

Set hostname:

```bash
sudo hostnamectl set-hostname srv01
```

Edit `/etc/hosts`:

```bash
sudo nano /etc/hosts
```

Isi:

```text
127.0.0.1       localhost
172.16.141.129  srv01 aliusman.com www.aliusman.com ns1.aliusman.com
```

Cek hostname:

```bash
hostnamectl
```

---

## 7. Setup Webroot Apache

Buat folder website:

```bash
sudo mkdir -p /var/www/html/aliusman.com
```

Buat file index:

```bash
sudo nano /var/www/html/aliusman.com/index.html
```

Isi:

```html
<!DOCTYPE html>
<html>
<head>
    <title>aliusman.com</title>
</head>
<body>
    <h1>aliusman.com berhasil berjalan</h1>
    <p>Apache2 + BIND9 + Self-Signed SSL on Ubuntu Server VMware</p>
</body>
</html>
```

Set permission:

```bash
sudo chown -R www-data:www-data /var/www/html/aliusman.com
sudo find /var/www/html/aliusman.com -type d -exec chmod 755 {} \;
sudo find /var/www/html/aliusman.com -type f -exec chmod 644 {} \;
sudo chmod 755 /var/www
sudo chmod 755 /var/www/html
```

---

## 8. Setup SSL Self-Signed Certificate

Buat self-signed certificate dengan SAN untuk domain dan IP:

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
-keyout /etc/ssl/private/aliusman.com-selfsigned.key \
-out /etc/ssl/certs/aliusman.com-selfsigned.crt \
-subj "/C=ID/ST=Jakarta/L=Jakarta/O=Aliusman Lab/OU=IT/CN=aliusman.com" \
-addext "subjectAltName=DNS:aliusman.com,DNS:www.aliusman.com,DNS:ns1.aliusman.com,IP:172.16.141.129"
```

Set permission:

```bash
sudo chmod 600 /etc/ssl/private/aliusman.com-selfsigned.key
sudo chmod 644 /etc/ssl/certs/aliusman.com-selfsigned.crt
sudo chown root:root /etc/ssl/private/aliusman.com-selfsigned.key
sudo chown root:root /etc/ssl/certs/aliusman.com-selfsigned.crt
```

Cek file SSL:

```bash
sudo ls -lah /etc/ssl/private/aliusman.com-selfsigned.key
sudo ls -lah /etc/ssl/certs/aliusman.com-selfsigned.crt
```

---

## 9. Setup Apache HTTP + HTTPS

Aktifkan module Apache:

```bash
sudo a2enmod ssl
sudo a2enmod rewrite
sudo a2enmod headers
```

Buat file virtual host:

```bash
sudo nano /etc/apache2/sites-available/aliusman.com.conf
```

Isi konfigurasi berikut:

```apache
<VirtualHost *:80>
    ServerName aliusman.com
    ServerAlias www.aliusman.com

    Redirect permanent / https://aliusman.com/
</VirtualHost>

<IfModule mod_ssl.c>
<VirtualHost *:443>
    ServerAdmin admin@aliusman.com
    ServerName aliusman.com
    ServerAlias www.aliusman.com

    DocumentRoot /var/www/html/aliusman.com

    <Directory /var/www/html/aliusman.com>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/aliusman.com-selfsigned.crt
    SSLCertificateKeyFile /etc/ssl/private/aliusman.com-selfsigned.key

    ErrorLog ${APACHE_LOG_DIR}/aliusman.com_ssl_error.log
    CustomLog ${APACHE_LOG_DIR}/aliusman.com_ssl_access.log combined
</VirtualHost>
</IfModule>
```

Disable default site:

```bash
sudo a2dissite 000-default.conf
```

Enable site:

```bash
sudo a2ensite aliusman.com.conf
```

Cek konfigurasi Apache:

```bash
sudo apache2ctl configtest
```

Jika hasilnya:

```text
Syntax OK
```

Restart Apache:

```bash
sudo systemctl restart apache2
sudo systemctl status apache2 --no-pager
```

Cek virtual host:

```bash
sudo apache2ctl -S
```

Pastikan ada vhost untuk port `80` dan `443`.

---

## 10. Setup DNS Server BIND9

Buat folder zone:

```bash
sudo mkdir -p /etc/bind/zones
```

Edit local zone:

```bash
sudo nano /etc/bind/named.conf.local
```

Isi:

```conf
zone "aliusman.com" {
    type master;
    file "/etc/bind/zones/db.aliusman.com";
};

zone "141.16.172.in-addr.arpa" {
    type master;
    file "/etc/bind/zones/db.172.16.141";
};
```

---

## 11. Buat Forward Zone

Buat file:

```bash
sudo nano /etc/bind/zones/db.aliusman.com
```

Isi:

```dns
$TTL    604800
@       IN      SOA     ns1.aliusman.com. admin.aliusman.com. (
                        2026070201 ; Serial
                        604800     ; Refresh
                        86400      ; Retry
                        2419200    ; Expire
                        604800 )   ; Negative Cache TTL

; Name Server
@       IN      NS      ns1.aliusman.com.

; A Records
@       IN      A       172.16.141.129
ns1     IN      A       172.16.141.129
www     IN      A       172.16.141.129
```

---

## 12. Buat Reverse Zone

Buat file:

```bash
sudo nano /etc/bind/zones/db.172.16.141
```

Isi:

```dns
$TTL    604800
@       IN      SOA     ns1.aliusman.com. admin.aliusman.com. (
                        2026070201 ; Serial
                        604800     ; Refresh
                        86400      ; Retry
                        2419200    ; Expire
                        604800 )   ; Negative Cache TTL

@       IN      NS      ns1.aliusman.com.

129     IN      PTR     aliusman.com.
129     IN      PTR     www.aliusman.com.
129     IN      PTR     ns1.aliusman.com.
```

---

## 13. Konfigurasi BIND9 Options

Edit:

```bash
sudo nano /etc/bind/named.conf.options
```

Isi:

```conf
acl "trusted" {
    127.0.0.1;
    172.16.141.0/24;
};

options {
    directory "/var/cache/bind";

    recursion yes;
    allow-recursion { trusted; };
    allow-query { trusted; };

    listen-on { 127.0.0.1; 172.16.141.129; };
    listen-on-v6 { none; };

    forwarders {
        8.8.8.8;
        1.1.1.1;
    };

    dnssec-validation auto;
};
```

---

## 14. Validasi dan Restart BIND9

Cek konfigurasi BIND9:

```bash
sudo named-checkconf
```

Cek forward zone:

```bash
sudo named-checkzone aliusman.com /etc/bind/zones/db.aliusman.com
```

Cek reverse zone:

```bash
sudo named-checkzone 141.16.172.in-addr.arpa /etc/bind/zones/db.172.16.141
```

Jika hasilnya `OK`, restart BIND9:

```bash
sudo systemctl restart bind9
sudo systemctl status bind9 --no-pager
```

---

## 15. Setup Firewall Ubuntu Server

Izinkan SSH, DNS, HTTP, dan HTTPS:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 53/tcp
sudo ufw allow 53/udp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

Aktifkan UFW:

```bash
sudo ufw enable
```

Cek status:

```bash
sudo ufw status
```

---

## 16. Test dari Ubuntu Server VM

Test DNS:

```bash
dig @172.16.141.129 aliusman.com
dig @172.16.141.129 www.aliusman.com
dig @172.16.141.129 ns1.aliusman.com
```

Test reverse DNS:

```bash
dig @172.16.141.129 -x 172.16.141.129
```

Test HTTP redirect:

```bash
curl -I http://aliusman.com
```

Expected:

```text
HTTP/1.1 301 Moved Permanently
Location: https://aliusman.com/
```

Test HTTPS:

```bash
curl -k -I https://aliusman.com
```

Expected:

```text
HTTP/1.1 200 OK
```

Test isi website:

```bash
curl -k https://aliusman.com
```

---

# 17. Setup DNS Client di Linux Host

Bagian ini dilakukan di **Linux host/client**, bukan di Ubuntu Server VM.

Tujuannya agar ketika membuka:

```text
https://aliusman.com
```

Linux host akan resolve domain ke:

```text
172.16.141.129
```

---

## Opsi A — Linux Client dengan NetworkManager

Cek nama koneksi:

```bash
nmcli con show
```

Contoh nama koneksi:

```text
Wired connection 1
```

Set DNS ke Ubuntu Server VM:

```bash
sudo nmcli con mod "Wired connection 1" ipv4.dns "172.16.141.129"
sudo nmcli con mod "Wired connection 1" ipv4.ignore-auto-dns yes
sudo nmcli con down "Wired connection 1"
sudo nmcli con up "Wired connection 1"
```

Cek DNS aktif:

```bash
resolvectl status
```

Flush cache DNS:

```bash
sudo resolvectl flush-caches
```

Test:

```bash
nslookup aliusman.com
dig aliusman.com
ping aliusman.com
curl -k https://aliusman.com
```

---

## Opsi B — Linux Client dengan systemd-resolved

Cek interface:

```bash
ip link
```

Misalnya interface client:

```text
enp0s3
```

Set DNS:

```bash
sudo resolvectl dns enp0s3 172.16.141.129
sudo resolvectl domain enp0s3 aliusman.com
sudo resolvectl flush-caches
```

Test:

```bash
resolvectl query aliusman.com
curl -k https://aliusman.com
```

---

## Opsi C — Linux Client Sementara via `/etc/resolv.conf`

Edit:

```bash
sudo nano /etc/resolv.conf
```

Isi:

```text
nameserver 172.16.141.129
```

Test:

```bash
nslookup aliusman.com
curl -k https://aliusman.com
```

> Catatan: `/etc/resolv.conf` bisa berubah otomatis setelah reboot atau reconnect jaringan.

---

## Opsi D — Linux Client via `/etc/hosts`

Jika tidak ingin mengubah DNS client, tambahkan mapping manual:

```bash
sudo nano /etc/hosts
```

Tambahkan:

```text
172.16.141.129 aliusman.com www.aliusman.com ns1.aliusman.com
```

Flush DNS:

```bash
sudo resolvectl flush-caches
```

Test:

```bash
ping aliusman.com
curl -k https://aliusman.com
```

---

# 18. Setup DNS Client di Windows Host

Bagian ini dilakukan di **Windows host/client**, bukan di Ubuntu Server VM.

---

## Opsi A — Windows via GUI

1. Buka **Control Panel**.
2. Masuk ke **Network and Internet**.
3. Pilih **Network and Sharing Center**.
4. Klik **Change adapter settings**.
5. Klik kanan adapter yang digunakan, misalnya:

```text
Ethernet
Wi-Fi
VMware Network Adapter VMnet1
VMware Network Adapter VMnet8
```

6. Pilih **Properties**.
7. Pilih **Internet Protocol Version 4 (TCP/IPv4)**.
8. Klik **Properties**.
9. Pilih **Use the following DNS server addresses**.
10. Isi:

```text
Preferred DNS server : 172.16.141.129
Alternate DNS server : 8.8.8.8
```

11. Klik **OK**.

Flush DNS:

```cmd
ipconfig /flushdns
```

Test:

```cmd
nslookup aliusman.com
ping aliusman.com
curl.exe -k https://aliusman.com
```

Buka browser:

```text
https://aliusman.com
```

Karena SSL self-signed, browser akan menampilkan warning. Pilih:

```text
Advanced > Proceed to aliusman.com
```

---

## Opsi B — Windows via PowerShell Administrator

Buka PowerShell sebagai Administrator.

Cek adapter:

```powershell
Get-NetAdapter
```

Contoh adapter:

```text
Ethernet
Wi-Fi
VMware Network Adapter VMnet1
VMware Network Adapter VMnet8
```

Set DNS:

```powershell
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses 172.16.141.129
```

Jika pakai VMware Host-Only, bisa gunakan adapter VMnet1:

```powershell
Set-DnsClientServerAddress -InterfaceAlias "VMware Network Adapter VMnet1" -ServerAddresses 172.16.141.129
```

Jika pakai VMware NAT, bisa gunakan adapter VMnet8:

```powershell
Set-DnsClientServerAddress -InterfaceAlias "VMware Network Adapter VMnet8" -ServerAddresses 172.16.141.129
```

Flush DNS:

```powershell
Clear-DnsClientCache
```

Test:

```powershell
nslookup aliusman.com
ping aliusman.com
curl.exe -k https://aliusman.com
```

Reset DNS kembali otomatis:

```powershell
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ResetServerAddresses
```

---

## Opsi C — Windows via Hosts File

Jika tidak ingin mengubah DNS adapter, bisa pakai hosts file.

Buka Notepad sebagai Administrator, lalu buka file:

```text
C:\Windows\System32\drivers\etc\hosts
```

Tambahkan:

```text
172.16.141.129 aliusman.com www.aliusman.com ns1.aliusman.com
```

Simpan, lalu flush DNS:

```cmd
ipconfig /flushdns
```

Test:

```cmd
ping aliusman.com
curl.exe -k https://aliusman.com
```

---

# 19. Import Self-Signed Certificate ke Linux Client agar Tidak Warning

Opsional. Jika ingin Linux client percaya certificate self-signed:

Copy certificate dari server:

```bash
scp ghroot67@172.16.141.129:/etc/ssl/certs/aliusman.com-selfsigned.crt .
```

Install ke trust store Debian/Ubuntu client:

```bash
sudo cp aliusman.com-selfsigned.crt /usr/local/share/ca-certificates/aliusman.com.crt
sudo update-ca-certificates
```

Test tanpa `-k`:

```bash
curl https://aliusman.com
```

Untuk Arch Linux client:

```bash
sudo trust anchor --store aliusman.com-selfsigned.crt
```

Test:

```bash
curl https://aliusman.com
```

---

# 20. Import Self-Signed Certificate ke Windows Client agar Tidak Warning

Opsional. Jika ingin Windows/Browser percaya certificate self-signed:

1. Copy file certificate dari server:

```text
/etc/ssl/certs/aliusman.com-selfsigned.crt
```

2. Pindahkan ke Windows.
3. Rename jika perlu menjadi:

```text
aliusman.com-selfsigned.crt
```

4. Double click certificate.
5. Klik **Install Certificate**.
6. Pilih **Local Machine**.
7. Pilih **Place all certificates in the following store**.
8. Pilih:

```text
Trusted Root Certification Authorities
```

9. Klik **Next > Finish**.
10. Restart browser.

Test:

```cmd
curl.exe https://aliusman.com
```

---

# 21. Final Checklist Server

Jalankan di Ubuntu Server VM:

```bash
ip a
ip route
sudo systemctl status apache2 --no-pager
sudo systemctl status bind9 --no-pager
sudo apache2ctl configtest
sudo named-checkconf
sudo named-checkzone aliusman.com /etc/bind/zones/db.aliusman.com
sudo named-checkzone 141.16.172.in-addr.arpa /etc/bind/zones/db.172.16.141
dig @172.16.141.129 aliusman.com
curl -I http://aliusman.com
curl -k -I https://aliusman.com
```

Expected:

```text
Apache config : Syntax OK
BIND zone     : OK
DNS result    : 172.16.141.129
HTTP result   : 301 Moved Permanently
HTTPS result  : 200 OK
```

---

# 22. Troubleshooting

## Apache gagal start

```bash
sudo apache2ctl configtest
sudo journalctl -u apache2 -xe --no-pager
```

Jika error:

```text
SSLCertificateFile does not exist or is empty
```

Cek file:

```bash
sudo ls -lah /etc/ssl/certs/aliusman.com-selfsigned.crt
sudo ls -lah /etc/ssl/private/aliusman.com-selfsigned.key
```

Jika tidak ada, buat ulang certificate pada bagian SSL.

---

## Error 403 Forbidden

Cek isi webroot:

```bash
ls -la /var/www/html/aliusman.com
```

Pastikan ada:

```text
index.html
```

Perbaiki permission:

```bash
sudo chown -R www-data:www-data /var/www/html/aliusman.com
sudo find /var/www/html/aliusman.com -type d -exec chmod 755 {} \;
sudo find /var/www/html/aliusman.com -type f -exec chmod 644 {} \;
sudo systemctl restart apache2
```

---

## Domain masih mengarah ke IP Docker lama

Di Linux client:

```bash
cat /etc/hosts
sudo resolvectl flush-caches
```

Hapus entry lama seperti:

```text
10.15.20.10 aliusman.com
```

Di Windows:

```cmd
ipconfig /flushdns
notepad C:\Windows\System32\drivers\etc\hosts
```

Hapus entry lama seperti:

```text
10.15.20.10 aliusman.com
```

Test ulang:

```cmd
nslookup aliusman.com
ping aliusman.com
```

---

## Client tidak bisa akses server VM

Cek dari client:

```bash
ping 172.16.141.129
```

Jika gagal:

1. Pastikan VMware Network Adapter sudah benar: Bridged atau Host-Only.
2. Pastikan IP server satu subnet dengan client.
3. Cek firewall server:

```bash
sudo ufw status
```

4. Cek Apache listen port:

```bash
sudo ss -tulpn | grep -E ':80|:443'
```

5. Cek DNS listen port:

```bash
sudo ss -tulpn | grep ':53'
```

---

## DNS tidak resolve

Test langsung ke DNS server:

```bash
dig @172.16.141.129 aliusman.com
```

Jika berhasil tetapi `dig aliusman.com` gagal, berarti DNS client belum diarahkan ke `172.16.141.129`.

Jika gagal semua, cek BIND9:

```bash
sudo named-checkconf
sudo named-checkzone aliusman.com /etc/bind/zones/db.aliusman.com
sudo journalctl -u bind9 -xe --no-pager
```

---

## HTTPS warning di browser

Itu normal karena menggunakan self-signed certificate.

Solusi:

1. Klik **Advanced > Proceed**; atau
2. Import certificate ke Trusted Root CA pada Linux/Windows client.

---

# 23. Quick Command Summary

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install apache2 bind9 bind9utils dnsutils openssl ufw -y
sudo mkdir -p /var/www/html/aliusman.com
sudo tee /var/www/html/aliusman.com/index.html >/dev/null <<'HTML'
<!DOCTYPE html>
<html>
<head><title>aliusman.com</title></head>
<body><h1>aliusman.com berhasil berjalan</h1></body>
</html>
HTML
sudo chown -R www-data:www-data /var/www/html/aliusman.com
sudo find /var/www/html/aliusman.com -type d -exec chmod 755 {} \;
sudo find /var/www/html/aliusman.com -type f -exec chmod 644 {} \;
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
-keyout /etc/ssl/private/aliusman.com-selfsigned.key \
-out /etc/ssl/certs/aliusman.com-selfsigned.crt \
-subj "/C=ID/ST=Jakarta/L=Jakarta/O=Aliusman Lab/OU=IT/CN=aliusman.com" \
-addext "subjectAltName=DNS:aliusman.com,DNS:www.aliusman.com,DNS:ns1.aliusman.com,IP:172.16.141.129"
sudo a2enmod ssl rewrite headers
sudo a2dissite 000-default.conf
sudo a2ensite aliusman.com.conf
sudo apache2ctl configtest
sudo systemctl restart apache2
sudo named-checkconf
sudo systemctl restart bind9
```
