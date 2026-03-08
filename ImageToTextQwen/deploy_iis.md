# 🚀 Deploying LivingAI on Windows IIS

## Prerequisites

| Requirement       | Details                                |
|-------------------|----------------------------------------|
| Windows Server    | 2016 / 2019 / 2022 (or Windows 10/11) |
| IIS               | Installed with CGI module              |
| Python            | 3.10+ installed system-wide            |

---

## Step 1 — Enable IIS Features

Open **PowerShell as Administrator** and run:

```powershell
# Install IIS with CGI support
Install-WindowsFeature -Name Web-Server, Web-CGI -IncludeManagementTools

# If on Windows 10/11 (non-Server), use this instead:
# Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-CGI
```

Also install the **URL Rewrite** module:
- Download from: https://www.iis.net/downloads/microsoft/url-rewrite

---

## Step 2 — Install Python & Dependencies

1. Download **Python 3.12** from [python.org](https://www.python.org/downloads/)
2. ✅ Check **"Add Python to PATH"** during install
3. ✅ Check **"Install for all users"** (installs to `C:\Python312`)

Then in **Command Prompt (Admin)**:

```cmd
pip install wfastcgi
```

> ⚠️ **IMPORTANT for servers with existing .NET sites:**
> Do **NOT** run `wfastcgi-enable` — that registers Python FastCGI globally and
> could interfere with your .NET sites. Instead, register it only for the
> LivingAI site using the `appcmd` command below:

```cmd
%windir%\system32\inetsrv\appcmd set config /section:system.webServer/fastCGI /+[fullPath='C:\Python312\python.exe',arguments='C:\Python312\Lib\site-packages\wfastcgi.py']
```

> **Note:** Adjust the paths above if your Python is installed elsewhere.

---

## Step 3 — Create a Dedicated Application Pool

This keeps LivingAI **completely isolated** from your .NET sites.

1. Open **IIS Manager** (`inetmgr`)
2. Click **Application Pools** → **Add Application Pool**

| Setting              | Value                 |
|----------------------|-----------------------|
| Name                 | `LivingAI_AppPool`   |
| .NET CLR version     | **No Managed Code**  |
| Managed pipeline     | **Integrated**        |

3. Click **OK**

> **Why "No Managed Code"?** This tells IIS not to load the .NET CLR for this
> pool. Your Flask app uses Python via FastCGI, not .NET. This ensures zero
> interaction with .NET runtime used by your other sites.

---

## Step 4 — Copy Project Files

Copy the entire project to the IIS directory:

```cmd
xcopy /E /I "YourProjectFolder" "C:\inetpub\wwwroot\LivingAI"
mkdir "C:\inetpub\wwwroot\LivingAI\logs"
```

Your folder should look like:

```
C:\inetpub\wwwroot\LivingAI\
├── web.config
├── backend\
│   ├── app.py
│   ├── requirements.txt
│   ├── .env
│   └── .env.example
├── frontend\
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── logs\
```

---

## Step 5 — Install Python Packages

```cmd
cd C:\inetpub\wwwroot\LivingAI\backend
pip install -r requirements.txt
```

---

## Step 6 — Configure Your API Token

```cmd
copy .env.example .env
notepad .env
```

Set your HuggingFace token:

```
HF_API_TOKEN=hf_YOUR_ACTUAL_TOKEN_HERE
```

---

## Step 7 — Create the IIS Site

1. Open **IIS Manager** (`inetmgr`)
2. Right-click **Sites** → **Add Website**

| Setting           | Value                                    |
|-------------------|------------------------------------------|
| Site name         | `LivingAI`                               |
| Application pool  | `LivingAI_AppPool` ← select from dropdown|
| Physical path     | `C:\inetpub\wwwroot\LivingAI`           |
| Binding - Port    | Use a **different port** (e.g. `8080`) or a unique **Host name** |

3. Click **OK**

> ⚠️ **Port / Binding:** If your .NET sites already use port 80, either:
> - Use a different port (e.g. `8080`) — access via `http://server:8080`
> - Or set a unique **Host name** (e.g. `livingai.yourdomain.com`) and
>   point DNS to this server

---

## Step 8 — Set Permissions

In **Command Prompt (Admin)**:

```cmd
icacls "C:\inetpub\wwwroot\LivingAI" /grant "IIS_IUSRS:(OI)(CI)RX"
icacls "C:\inetpub\wwwroot\LivingAI\logs" /grant "IIS_IUSRS:(OI)(CI)M"
icacls "C:\inetpub\wwwroot\LivingAI\backend\.env" /grant "IIS_IUSRS:R"
```

---

## Step 9 — Update `web.config` (if needed)

Open `C:\inetpub\wwwroot\LivingAI\web.config` and verify the `scriptProcessor` path matches your Python install. Common paths:

| Python Version | Path                                                                               |
|----------------|------------------------------------------------------------------------------------|
| Python 3.12    | `C:\Python312\python.exe\|C:\Python312\Lib\site-packages\wfastcgi.py`              |
| Python 3.11    | `C:\Python311\python.exe\|C:\Python311\Lib\site-packages\wfastcgi.py`              |
| User install   | `C:\Users\<you>\AppData\Local\Programs\Python\Python312\python.exe\|...`           |

---

## Step 10 — Restart & Test

```cmd
iisreset
```

Open your browser and go to: **http://localhost**

---

## 🔧 Troubleshooting

| Problem                          | Fix                                                                                       |
|----------------------------------|-------------------------------------------------------------------------------------------|
| **500 Internal Server Error**    | Check `C:\inetpub\wwwroot\LivingAI\logs\wfastcgi.log` for details                       |
| **CGI module not found**         | Re-run: `Install-WindowsFeature Web-CGI`                                                 |
| **"scriptProcessor" error**      | Verify your Python path in `web.config` matches actual install                           |
| **Static files not loading**     | Ensure URL Rewrite module is installed                                                    |
| **Permission denied**            | Re-run the `icacls` permissions commands from Step 8                                     |
| **Module not found (Python)**    | Run `pip install -r requirements.txt` with the same Python used in `web.config`          |
