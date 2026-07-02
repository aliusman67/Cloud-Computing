# Panduan Setup Apache, DNS, SSL, dan IP Statis di Ubuntu Server VMware

Dokumen ini merupakan README utama proyek sekaligus panduan deployment web statis pada server.

Panduan ini menggunakan **Ubuntu Server di VMware Workstation/Player** sebagai server, **Apache2** sebagai web server, **BIND9** untuk DNS lokal (opsional), **Let's Encrypt/Certbot** untuk SSL publik, dan Windows/Linux pada laptop fisik sebagai host.

> Semua alamat pada panduan adalah contoh. Ganti sesuai jaringan dan domain Anda. Alamat publik `203.0.113.10` memang dicadangkan untuk dokumentasi dan tidak dapat dipakai sebagai alamat server nyata.

## 1. Rancangan contoh

| Komponen | Nilai contoh |
|---|---|
| Mode jaringan VMware | `Bridged` |
| Domain publik | `example.com` |
| Nama host web | `www.example.com` |
| IP publik router/server | `203.0.113.10` |
| IP lokal server | `192.168.1.10/24` |
| Gateway LAN | `192.168.1.1` |
| Interface Linux VM | `ens33` |
| DNS lokal opsional | `192.168.1.10` |
| Zona DNS lokal opsional | `lab.example.com` |
| Document root Apache | `/var/www/example.com/public_html` |

Alur akses dari laptop host:

```text
Browser di host -> jaringan Bridged -> 192.168.1.10:80/443 -> Apache di VM
```

Alur akses publik:

```text
Browser -> DNS publik -> IP publik -> NAT/router -> 192.168.1.10:80/443 -> Apache
```

Sebelum mulai:

1. Siapkan VM Ubuntu Server dengan akun yang memiliki akses `sudo`.
2. Pastikan IP statis yang dipilih tidak sedang dipakai perangkat lain dan berada di luar pool DHCP, atau buat DHCP reservation di router.
3. Miliki domain dan akses ke panel DNS domain tersebut.
4. Jika server berada di belakang router, siapkan port forwarding TCP `80` dan `443` ke `192.168.1.10`.
5. Pastikan koneksi ISP memiliki IP publik. Port forwarding biasa tidak bekerja jika koneksi berada di balik CGNAT.

## 2. Konfigurasi jaringan VMware agar VM dapat diakses host

### 2.1 Pilih mode jaringan

| Mode VMware | Akses dari host | Akses dari perangkat LAN lain | Internet di VM | Penggunaan |
|---|---:|---:|---:|---|
| **Bridged** | Ya | Ya | Ya | Direkomendasikan untuk web server LAN/publik |
| **NAT** | Umumnya ya | Tidak langsung | Ya | Lab yang hanya perlu diakses host |
| **Host-only** | Ya | Tidak | Tidak secara default | Lab tertutup antara host dan VM |

Gunakan **Bridged** jika website harus dibuka dari host dan perangkat lain pada Wi-Fi/LAN yang sama. VM akan terlihat seperti perangkat fisik tersendiri dan memperoleh alamat dari router yang sama dengan host.

Gunakan **NAT** jika website hanya perlu diakses dari laptop host dan VM tetap memerlukan Internet. IP VM akan berada pada subnet virtual `VMnet8`, bukan selalu pada subnet router fisik.

Gunakan **Host-only** untuk jaringan lab terisolasi. Jika VM juga perlu Internet, tambahkan adapter kedua bertipe NAT; jangan beri default gateway pada adapter Host-only agar tidak terjadi dua default route.

### 2.2 Atur adapter VM menjadi Bridged

1. Matikan VM Ubuntu Server.
2. Buka **VM > Settings > Network Adapter**.
3. Centang **Connected** dan **Connect at power on**.
4. Pilih **Bridged: Connected directly to the physical network**.
5. Aktifkan **Replicate physical network connection state** jika laptop sering berpindah antara Wi-Fi dan Ethernet.
6. Jalankan kembali VM.

Jika mode **Automatic** memilih adapter host yang salah:

1. Buka **Edit > Virtual Network Editor** sebagai Administrator.
2. Pilih `VMnet0` dengan tipe **Bridged**.
3. Pada **Bridged to**, pilih adapter host yang benar, misalnya adapter Wi-Fi atau Ethernet yang sedang aktif.
4. Simpan, kemudian restart koneksi atau VM.

> Beberapa jaringan kampus, kantor, hotel, atau hotspot membatasi MAC address tambahan sehingga Bridged tidak memperoleh IP. Gunakan NAT jika kebijakan jaringan tersebut tidak mengizinkan VM sebagai perangkat terpisah.

### 2.3 Dapatkan IP Ubuntu Server

Mulai dengan DHCP untuk memastikan jaringan VMware bekerja sebelum menetapkan IP statis:

```bash
ip -4 -br address
ip route
hostname -I
ping -c 4 1.1.1.1
```

Contoh hasil:

```text
ens33    UP    192.168.1.105/24
```

Pada VMware, nama interface Ubuntu sering berupa `ens33`, tetapi dapat berbeda. Gunakan nama yang benar dari hasil `ip -4 -br address`.

Periksa subnet host:

Windows host:

```powershell
ipconfig
```

Linux host:

```bash
ip -4 -br address
ip route
```

Dalam mode Bridged, host dan VM harus berada pada subnet yang sama. Contohnya host `192.168.1.20/24`, VM `192.168.1.105/24`, dan gateway keduanya `192.168.1.1`.

### 2.4 Uji akses dari host

Setelah Apache dipasang pada bagian 5, uji port dari host.

Windows PowerShell:

```powershell
Test-Connection 192.168.1.10 -Count 4
Test-NetConnection 192.168.1.10 -Port 80
curl.exe -I http://192.168.1.10
```

Linux/macOS:

```bash
ping -c 4 192.168.1.10
curl -I http://192.168.1.10
```

Kemudian buka `http://192.168.1.10` pada browser host. Tes TCP/HTTP lebih menentukan daripada ping karena ICMP dapat diblokir firewall.

Untuk mode NAT, ganti `192.168.1.10` dengan IP DHCP VM pada subnet `VMnet8`. Host biasanya dapat mengakses IP tersebut secara langsung, sedangkan laptop lain pada LAN tidak dapat memulai koneksi ke VM. Gunakan Bridged atau konfigurasi port forwarding NAT VMware jika perangkat LAN lain juga perlu mengaksesnya.

### 2.5 Gunakan nama domain lokal pada host (opsional)

Untuk pengujian tanpa DNS publik atau BIND9, petakan nama `webserver.test` langsung ke IP VM.

Pada Windows, buka Notepad sebagai Administrator, lalu edit:

```text
C:\Windows\System32\drivers\etc\hosts
```

Pada Linux/macOS, edit `/etc/hosts` dengan hak administrator. Tambahkan baris yang sama pada kedua jenis host:

```text
192.168.1.10 webserver.test www.webserver.test
```

Tambahkan nama tersebut pada VirtualHost Apache di bagian 5:

```apache
ServerName example.com
ServerAlias www.example.com webserver.test www.webserver.test
```

Muat ulang Apache dan uji dari host:

```bash
sudo apache2ctl configtest
sudo systemctl reload apache2
```

```text
http://webserver.test
```

Nama `.test` hanya berlaku pada host yang file `hosts`-nya diubah dan tidak dapat memperoleh sertifikat Let's Encrypt. Gunakan domain publik pada bagian 6 atau BIND9 pada bagian 7 jika nama harus tersedia untuk banyak perangkat.

### 2.6 Troubleshooting koneksi host ke VM

Jalankan pada Ubuntu Server:

```bash
ip link
ip -4 address
ip route
sudo systemctl status apache2 --no-pager
sudo ss -lntp | grep -E ':80|:443'
sudo ufw status verbose
```

Periksa secara berurutan:

1. Adapter VM berstatus **Connected** dan **Connect at power on**.
2. VM memiliki IPv4 selain `127.0.0.1` dan `169.254.x.x`.
3. IP statis, prefix, gateway, dan DNS sesuai subnet mode VMware.
4. Apache mendengarkan pada `0.0.0.0:80`/`*:80`, bukan hanya `127.0.0.1:80`.
5. UFW mengizinkan `Apache` atau `Apache Full`.
6. Pada Bridged, `VMnet0` terhubung ke adapter fisik host yang sedang aktif.
7. VPN atau firewall host tidak memblokir jaringan VMware.
8. Jika Bridged gagal tetapi NAT berhasil, kemungkinan jaringan fisik tidak menerima MAC address tambahan atau adapter Bridged salah.

## 3. Konfigurasi IP statis di Linux

### 3.1 Identifikasi interface dan konfigurasi saat ini

```bash
ip -br address
ip route
resolvectl status
ls -l /etc/netplan/
```

Catat nama interface aktif, misalnya `ens33`, serta gateway dan DNS yang sedang digunakan.

### 3.2 Konfigurasi Netplan pada Ubuntu Server

Buat atau edit `/etc/netplan/99-static-ip.yaml`.

> Konfigurasi berikut khusus contoh **Bridged** pada LAN `192.168.1.0/24`. Untuk NAT atau Host-only, lihat subnet `VMnet8` atau `VMnet1` melalui **Virtual Network Editor**, lalu sesuaikan alamat, prefix, dan gateway. Jangan memakai `192.168.1.10` jika subnet VMware berbeda.

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    ens33:
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
ip -br address show ens33
ip route
resolvectl status ens33
ping -c 4 192.168.1.1
ping -c 4 1.1.1.1
getent hosts ubuntu.com
```

> Jika ada file Netplan lain yang juga mengatur interface yang sama, satukan konfigurasinya atau nonaktifkan definisi yang bertabrakan. Jangan mengedit `/etc/resolv.conf` langsung karena pada Ubuntu file tersebut umumnya dikelola oleh `systemd-resolved` melalui Netplan.

## 4. Konfigurasi IP statis di Windows

Gunakan IP klien yang berbeda dari server, misalnya `192.168.1.20`.

### 4.1 Melalui antarmuka grafis

1. Buka **Settings > Network & internet**.
2. Pilih **Ethernet** atau **Wi-Fi**, lalu buka properti jaringan.
3. Pada **IP assignment**, klik **Edit**.
4. Pilih **Manual**, aktifkan **IPv4**, lalu isi:
   - IP address: `192.168.1.20`
   - Subnet prefix length: `24`
   - Gateway: `192.168.1.1`
   - Preferred DNS untuk DNS publik: `1.1.1.1`
   - Alternate DNS: `9.9.9.9`
5. Jika memakai BIND9 lokal pada bagian 7, gunakan `192.168.1.10` sebagai DNS utama klien.
6. Simpan, lalu buka ulang koneksi bila diperlukan.

### 4.2 Melalui PowerShell

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

## 5. Instalasi dan konfigurasi Apache

### 5.1 Instal Apache dan firewall

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

### 5.2 Buat document root

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

### 5.3 Buat VirtualHost

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

## 6. Konfigurasi DNS publik agar domain dapat diakses

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

## 7. DNS lokal dengan BIND9 (opsional)

Bagian ini berguna untuk domain lab/intranet seperti `lab.example.com`. Klien LAN harus memakai `192.168.1.10` sebagai DNS agar record lokal dapat ditemukan.

### 7.1 Instal BIND9

```bash
sudo apt update
sudo apt install -y bind9 bind9-utils dnsutils
sudo systemctl enable --now bind9
```

### 7.2 Batasi resolver ke jaringan lokal

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

### 7.3 Tambahkan zona lokal

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

## 8. Implementasi SSL dengan Let's Encrypt

Let's Encrypt hanya dapat menerbitkan sertifikat setelah `example.com` dan `www.example.com` mengarah ke server publik dan port TCP `80` atau metode validasi lain dapat dijangkau.

### 8.1 Instal Certbot

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

### 8.2 Terbitkan sertifikat dan aktifkan redirect HTTPS

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

### 8.3 Uji perpanjangan otomatis

```bash
sudo certbot certificates
sudo certbot renew --dry-run
systemctl list-timers | grep -i certbot
```

Certbot memasang timer/pekerjaan perpanjangan otomatis. Tidak perlu membuat cron tambahan jika `renew --dry-run` berhasil.

> Sertifikat Let's Encrypt tidak cocok untuk nama yang hanya dapat diakses di DNS privat tanpa validasi domain publik. Untuk lab tertutup, gunakan internal Certificate Authority dan distribusikan root CA ke seluruh klien. Sertifikat self-signed boleh dipakai untuk pengujian, tetapi browser akan memberi peringatan sampai sertifikat/CA tersebut dipercaya.

## 9. Pemeriksaan akhir

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

- [ ] Adapter VMware terhubung dan mode jaringannya sesuai kebutuhan.
- [ ] Host dapat mencapai port `80` VM melalui alamat IP VM.
- [ ] Server selalu memperoleh IP LAN yang sama.
- [ ] Apache aktif dan VirtualHost menunjukkan document root yang benar.
- [ ] Record `A` domain publik mengarah ke IP publik yang benar.
- [ ] Port TCP `80` dan `443` diteruskan dan diizinkan firewall.
- [ ] Domain dapat dibuka dari jaringan di luar LAN.
- [ ] HTTP mengalihkan ke HTTPS.
- [ ] Sertifikat memuat domain utama dan `www`.
- [ ] `certbot renew --dry-run` berhasil.
- [ ] DNS lokal, jika digunakan, hanya menerima kueri/rekursi dari jaringan tepercaya.

## 10. Referensi resmi

- [Ubuntu Server: Install Apache2](https://documentation.ubuntu.com/server/how-to/web-services/install-apache2/)
- [Ubuntu Server: Configure Apache2 settings](https://documentation.ubuntu.com/server/how-to/web-services/configure-apache2-settings/)
- [Ubuntu Server: Configuring networks dengan Netplan](https://documentation.ubuntu.com/server/explanation/networking/configuring-networks/)
- [Ubuntu Server: Instalasi dan konfigurasi DNS/BIND9](https://documentation.ubuntu.com/server/how-to/networking/install-dns/)
- [Certbot: Instruksi Apache di Linux](https://certbot.eff.org/instructions?ws=apache&os=snap)
- [Microsoft Learn: New-NetIPAddress](https://learn.microsoft.com/powershell/module/nettcpip/new-netipaddress)
- [Microsoft Learn: Set-DnsClientServerAddress](https://learn.microsoft.com/powershell/module/dnsclient/set-dnsclientserveraddress)
- [Broadcom KB: Troubleshooting network connection failures pada VMware](https://knowledge.broadcom.com/external/article/307964/)
- [Broadcom KB: Memilih adapter fisik untuk Bridged/VMnet0](https://knowledge.broadcom.com/external/article/311353/)
