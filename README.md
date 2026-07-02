# Panduan Setup Apache, DNS, SSL, dan IP Statis

Dokumen ini merupakan README utama proyek sekaligus panduan deployment web statis pada server.

Panduan ini menggunakan **Ubuntu Server/Debian** sebagai web server, **Apache2** sebagai web server, **BIND9** untuk DNS lokal (opsional), **Let's Encrypt/Certbot** untuk SSL publik, dan **Windows 10/11 atau Windows Server** sebagai contoh klien Windows.

> Semua alamat pada panduan adalah contoh. Ganti sesuai jaringan dan domain Anda. Alamat publik `203.0.113.10` memang dicadangkan untuk dokumentasi dan tidak dapat dipakai sebagai alamat server nyata.

## 1. Rancangan contoh

| Komponen | Nilai contoh |
|---|---|
| Domain publik | `example.com` |
| Nama host web | `www.example.com` |
| IP publik router/server | `203.0.113.10` |
| IP lokal server | `192.168.1.10/24` |
| Gateway LAN | `192.168.1.1` |
| Interface Linux | `enp1s0` |
| DNS lokal opsional | `192.168.1.10` |
| Zona DNS lokal opsional | `lab.example.com` |
| Document root Apache | `/var/www/example.com/public_html` |

Alur akses publik:

```text
Browser -> DNS publik -> IP publik -> NAT/router -> 192.168.1.10:80/443 -> Apache
```

Sebelum mulai:

1. Siapkan server Ubuntu/Debian dengan akun yang memiliki akses `sudo`.
2. Pastikan IP statis yang dipilih tidak sedang dipakai perangkat lain dan berada di luar pool DHCP, atau buat DHCP reservation di router.
3. Miliki domain dan akses ke panel DNS domain tersebut.
4. Jika server berada di belakang router, siapkan port forwarding TCP `80` dan `443` ke `192.168.1.10`.
5. Pastikan koneksi ISP memiliki IP publik. Port forwarding biasa tidak bekerja jika koneksi berada di balik CGNAT.

## 2. Konfigurasi IP statis di Linux

### 2.1 Identifikasi interface dan konfigurasi saat ini

```bash
ip -br address
ip route
resolvectl status
ls -l /etc/netplan/
```

Catat nama interface aktif, misalnya `enp1s0`, serta gateway dan DNS yang sedang digunakan.

### 2.2 Konfigurasi Netplan pada Ubuntu Server

Buat atau edit `/etc/netplan/99-static-ip.yaml`:

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp1s0:
      dhcp4: false
      addresses:
        - 192.168.1.10/24
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses:
          - 1.1.1.1
          - 9.9.9.9
```

Amankan file, validasi, lalu terapkan:

```bash
sudo chmod 600 /etc/netplan/99-static-ip.yaml
sudo netplan generate
sudo netplan try
```

`netplan try` akan meminta konfirmasi dan mengembalikan konfigurasi lama jika koneksi terputus. Ini lebih aman saat konfigurasi dilakukan melalui SSH. Setelah berhasil:

```bash
sudo netplan apply
ip -br address show enp1s0
ip route
resolvectl status enp1s0
ping -c 4 192.168.1.1
ping -c 4 1.1.1.1
getent hosts ubuntu.com
```

> Jika ada file Netplan lain yang juga mengatur interface yang sama, satukan konfigurasinya atau nonaktifkan definisi yang bertabrakan. Jangan mengedit `/etc/resolv.conf` langsung karena pada Ubuntu file tersebut umumnya dikelola oleh `systemd-resolved` melalui Netplan.

## 3. Konfigurasi IP statis di Windows

Gunakan IP klien yang berbeda dari server, misalnya `192.168.1.20`.

### 3.1 Melalui antarmuka grafis

1. Buka **Settings > Network & internet**.
2. Pilih **Ethernet** atau **Wi-Fi**, lalu buka properti jaringan.
3. Pada **IP assignment**, klik **Edit**.
4. Pilih **Manual**, aktifkan **IPv4**, lalu isi:
   - IP address: `192.168.1.20`
   - Subnet prefix length: `24`
   - Gateway: `192.168.1.1`
   - Preferred DNS untuk DNS publik: `1.1.1.1`
   - Alternate DNS: `9.9.9.9`
5. Jika memakai BIND9 lokal pada bagian 6, gunakan `192.168.1.10` sebagai DNS utama klien.
6. Simpan, lalu buka ulang koneksi bila diperlukan.

### 3.2 Melalui PowerShell

Jalankan PowerShell sebagai Administrator:

```powershell
Get-NetAdapter
Get-NetIPConfiguration

New-NetIPAddress `
  -InterfaceAlias "Ethernet" `
  -IPAddress 192.168.1.20 `
  -PrefixLength 24 `
  -DefaultGateway 192.168.1.1

Set-DnsClientServerAddress `
  -InterfaceAlias "Ethernet" `
  -ServerAddresses ("1.1.1.1", "9.9.9.9")
```

Untuk memakai DNS lokal BIND9:

```powershell
Set-DnsClientServerAddress `
  -InterfaceAlias "Ethernet" `
  -ServerAddresses ("192.168.1.10")
```

Verifikasi:

```powershell
Get-NetIPConfiguration -InterfaceAlias "Ethernet"
Test-Connection 192.168.1.10 -Count 4
Resolve-DnsName example.com
```

Kembali ke DHCP jika diperlukan:

```powershell
Get-NetIPAddress -InterfaceAlias "Ethernet" -AddressFamily IPv4 |
  Where-Object PrefixOrigin -eq "Manual" |
  Remove-NetIPAddress -Confirm:$false

Set-NetIPInterface -InterfaceAlias "Ethernet" -AddressFamily IPv4 -Dhcp Enabled
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ResetServerAddresses
```

> Nama interface dapat berupa `Ethernet`, `Ethernet 2`, atau `Wi-Fi`. Gunakan nilai yang tampil dari `Get-NetAdapter`.

## 4. Instalasi dan konfigurasi Apache

### 4.1 Instal Apache dan firewall

```bash
sudo apt update
sudo apt install -y apache2 rsync
sudo systemctl enable --now apache2
sudo systemctl status apache2 --no-pager
```

Jika UFW digunakan:

```bash
sudo ufw allow OpenSSH
sudo ufw allow "Apache Full"
sudo ufw enable
sudo ufw status verbose
```

`Apache Full` membuka TCP `80` untuk HTTP dan TCP `443` untuk HTTPS. Pastikan SSH sudah diizinkan sebelum mengaktifkan UFW pada server remote.

Uji dari server dan komputer lain di LAN:

```bash
curl -I http://127.0.0.1
curl -I http://192.168.1.10
```

### 4.2 Buat document root

```bash
sudo install -d -o "$USER" -g www-data -m 0755 /var/www/example.com/public_html
```

Buat halaman uji:

```bash
sudo tee /var/www/example.com/public_html/index.html >/dev/null <<'HTML'
<!doctype html>
<html lang="id">
<head><meta charset="utf-8"><title>Apache aktif</title></head>
<body><h1>Apache, DNS, dan domain berhasil dikonfigurasi.</h1></body>
</html>
HTML
```

Untuk menyalin proyek web statis dari direktori proyek saat ini:

```bash
sudo rsync -av \
  --exclude '.git/' \
  --exclude 'SETUP_APACHE_DNS_SSL_STATIC_IP.md' \
  ./ /var/www/example.com/public_html/

sudo chown -R www-data:www-data /var/www/example.com
sudo find /var/www/example.com -type d -exec chmod 755 {} \;
sudo find /var/www/example.com -type f -exec chmod 644 {} \;
```

### 4.3 Buat VirtualHost

Buat `/etc/apache2/sites-available/example.com.conf`:

```apache
<VirtualHost *:80>
    ServerName example.com
    ServerAlias www.example.com

    DocumentRoot /var/www/example.com/public_html

    <Directory /var/www/example.com/public_html>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/example.com-error.log
    CustomLog ${APACHE_LOG_DIR}/example.com-access.log combined
</VirtualHost>
```

Aktifkan situs dan validasi konfigurasi:

```bash
sudo a2ensite example.com.conf
sudo a2dissite 000-default.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
sudo apache2ctl -S
```

Hasil `configtest` harus menunjukkan `Syntax OK`. Uji VirtualHost sebelum DNS aktif:

```bash
curl -I -H 'Host: example.com' http://127.0.0.1
```

## 5. Konfigurasi DNS publik agar domain dapat diakses

Untuk website Internet, cara paling sederhana dan andal adalah memakai authoritative DNS yang disediakan registrar atau penyedia DNS, bukan menjalankan BIND9 sendiri.

Tambahkan record berikut pada panel DNS domain:

| Type | Name/Host | Value/Target | TTL |
|---|---|---|---|
| `A` | `@` | IP publik asli server/router | `300` atau Auto |
| `CNAME` | `www` | `example.com` | `300` atau Auto |

Alternatifnya, `www` dapat memakai record `A` ke IP publik yang sama. Jangan membuat record `AAAA` kecuali server benar-benar memiliki IPv6 publik yang aktif dan dapat menerima trafik pada port `80/443`.

Jika server berada di belakang router:

| Port publik | Protokol | Tujuan LAN |
|---|---|---|
| `80` | TCP | `192.168.1.10:80` |
| `443` | TCP | `192.168.1.10:443` |

Verifikasi propagasi DNS dari resolver publik:

```bash
dig +short A example.com @1.1.1.1
dig +short A www.example.com @1.1.1.1
curl -I http://example.com
```

Hasil record `A` harus berupa IP publik asli, bukan `192.168.x.x`. Uji akses dari jaringan luar, misalnya data seluler, karena beberapa router tidak mendukung NAT loopback/hairpin.

> Jika IP publik berubah-ubah, gunakan fitur Dynamic DNS/API penyedia DNS atau minta IP statis dari ISP. Jika IP WAN router berada pada rentang private atau CGNAT seperti `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, atau `100.64.0.0/10`, mintalah IP publik dari ISP atau gunakan reverse tunnel/VPS.

## 6. DNS lokal dengan BIND9 (opsional)

Bagian ini berguna untuk domain lab/intranet seperti `lab.example.com`. Klien LAN harus memakai `192.168.1.10` sebagai DNS agar record lokal dapat ditemukan.

### 6.1 Instal BIND9

```bash
sudo apt update
sudo apt install -y bind9 bind9-utils dnsutils
sudo systemctl enable --now bind9
```

### 6.2 Batasi resolver ke jaringan lokal

Edit `/etc/bind/named.conf.options`:

```bind
acl trusted_lan {
    127.0.0.1;
    192.168.1.0/24;
};

options {
    directory "/var/cache/bind";

    recursion yes;
    allow-query { trusted_lan; };
    allow-recursion { trusted_lan; };

    listen-on { 127.0.0.1; 192.168.1.10; };
    listen-on-v6 { none; };

    forwarders {
        1.1.1.1;
        9.9.9.9;
    };

    dnssec-validation auto;
};
```

### 6.3 Tambahkan zona lokal

Tambahkan ke `/etc/bind/named.conf.local`:

```bind
zone "lab.example.com" {
    type master;
    file "/etc/bind/db.lab.example.com";
};
```

Buat `/etc/bind/db.lab.example.com`:

```dns
$TTL 300
@   IN  SOA ns1.lab.example.com. admin.lab.example.com. (
        2026070201 ; serial YYYYMMDDnn
        3600       ; refresh
        900        ; retry
        604800     ; expire
        300        ; negative cache TTL
)

@       IN  NS      ns1.lab.example.com.
ns1     IN  A       192.168.1.10
@       IN  A       192.168.1.10
www     IN  A       192.168.1.10
```

Naikkan nilai `serial` setiap kali zone file diubah. Lalu validasi dan muat ulang:

```bash
sudo chown root:bind /etc/bind/db.lab.example.com
sudo chmod 640 /etc/bind/db.lab.example.com
sudo named-checkconf
sudo named-checkzone lab.example.com /etc/bind/db.lab.example.com
sudo systemctl restart bind9
sudo systemctl status bind9 --no-pager
```

Jika UFW aktif, izinkan DNS hanya dari LAN:

```bash
sudo ufw allow from 192.168.1.0/24 to any port 53 proto udp
sudo ufw allow from 192.168.1.0/24 to any port 53 proto tcp
```

Uji dari server dan klien:

```bash
dig @127.0.0.1 lab.example.com
dig @192.168.1.10 www.lab.example.com
```

Tambahkan VirtualHost Apache kedua jika `lab.example.com` juga harus dilayani oleh Apache, atau ubah `ServerName`/`ServerAlias` pada VirtualHost yang ada.

> Untuk authoritative DNS publik self-hosted diperlukan minimal dua nameserver yang andal, delegasi NS dan glue record di registrar, port UDP/TCP `53`, serta resolver rekursif yang tidak terbuka ke Internet. Satu server BIND9 pada LAN tidak cukup untuk deployment authoritative DNS publik yang baik.

## 7. Implementasi SSL dengan Let's Encrypt

Let's Encrypt hanya dapat menerbitkan sertifikat setelah `example.com` dan `www.example.com` mengarah ke server publik dan port TCP `80` atau metode validasi lain dapat dijangkau.

### 7.1 Instal Certbot

Metode Snap direkomendasikan oleh dokumentasi Certbot:

```bash
sudo apt update
sudo apt install -y snapd
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/local/bin/certbot
```

Jika `/usr/local/bin/certbot` sudah ada dan mengarah ke `/snap/bin/certbot`, lewati perintah `ln`.

### 7.2 Terbitkan sertifikat dan aktifkan redirect HTTPS

```bash
sudo certbot --apache \
  -d example.com \
  -d www.example.com
```

Masukkan email, setujui Terms of Service, dan pilih redirect HTTP ke HTTPS ketika diminta. Certbot akan membuat/mengubah VirtualHost port `443`, memasang sertifikat, dan mengaktifkan modul Apache yang diperlukan.

Validasi:

```bash
sudo apache2ctl configtest
sudo systemctl reload apache2
curl -I http://example.com
curl -I https://example.com
openssl s_client -connect example.com:443 -servername example.com </dev/null
```

Respons HTTP seharusnya mengarah ke HTTPS, dan HTTPS seharusnya tidak menampilkan kesalahan sertifikat.

### 7.3 Uji perpanjangan otomatis

```bash
sudo certbot certificates
sudo certbot renew --dry-run
systemctl list-timers | grep -i certbot
```

Certbot memasang timer/pekerjaan perpanjangan otomatis. Tidak perlu membuat cron tambahan jika `renew --dry-run` berhasil.

> Sertifikat Let's Encrypt tidak cocok untuk nama yang hanya dapat diakses di DNS privat tanpa validasi domain publik. Untuk lab tertutup, gunakan internal Certificate Authority dan distribusikan root CA ke seluruh klien. Sertifikat self-signed boleh dipakai untuk pengujian, tetapi browser akan memberi peringatan sampai sertifikat/CA tersebut dipercaya.

## 8. Pemeriksaan akhir

Jalankan pemeriksaan berikut:

```bash
# Alamat dan routing
ip -br address
ip route

# Layanan dan port
sudo systemctl --no-pager --full status apache2
sudo ss -lntp | grep -E ':80|:443'

# Konfigurasi Apache
sudo apache2ctl configtest
sudo apache2ctl -S

# DNS publik
dig +short example.com @1.1.1.1
dig +short www.example.com @1.1.1.1

# HTTP dan HTTPS
curl -IL http://example.com
curl -IL https://example.com

# Log jika terjadi kegagalan
sudo tail -n 100 /var/log/apache2/example.com-error.log
sudo journalctl -u apache2 -n 100 --no-pager
```

Jika BIND9 digunakan:

```bash
sudo named-checkconf
sudo named-checkzone lab.example.com /etc/bind/db.lab.example.com
sudo ss -lntup | grep ':53'
sudo journalctl -u bind9 -n 100 --no-pager
```

Checklist keberhasilan:

- [ ] Server selalu memperoleh IP LAN yang sama.
- [ ] Apache aktif dan VirtualHost menunjukkan document root yang benar.
- [ ] Record `A` domain publik mengarah ke IP publik yang benar.
- [ ] Port TCP `80` dan `443` diteruskan dan diizinkan firewall.
- [ ] Domain dapat dibuka dari jaringan di luar LAN.
- [ ] HTTP mengalihkan ke HTTPS.
- [ ] Sertifikat memuat domain utama dan `www`.
- [ ] `certbot renew --dry-run` berhasil.
- [ ] DNS lokal, jika digunakan, hanya menerima kueri/rekursi dari jaringan tepercaya.

## 9. Referensi resmi

- [Ubuntu Server: Install Apache2](https://documentation.ubuntu.com/server/how-to/web-services/install-apache2/)
- [Ubuntu Server: Configure Apache2 settings](https://documentation.ubuntu.com/server/how-to/web-services/configure-apache2-settings/)
- [Ubuntu Server: Configuring networks dengan Netplan](https://documentation.ubuntu.com/server/explanation/networking/configuring-networks/)
- [Ubuntu Server: Instalasi dan konfigurasi DNS/BIND9](https://documentation.ubuntu.com/server/how-to/networking/install-dns/)
- [Certbot: Instruksi Apache di Linux](https://certbot.eff.org/instructions?ws=apache&os=snap)
- [Microsoft Learn: New-NetIPAddress](https://learn.microsoft.com/powershell/module/nettcpip/new-netipaddress)
- [Microsoft Learn: Set-DnsClientServerAddress](https://learn.microsoft.com/powershell/module/dnsclient/set-dnsclientserveraddress)
