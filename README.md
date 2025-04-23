# Betegség Történetek Vizualizációja

## Telepítés

```bash
npm install
```

## Fejlesztői Szerver Indítása

```bash
npm start
```

## Build Készítése

```bash
npm run build
```

## Környezeti Változók

A webhook URL konfigurálásához hozz létre egy `.env` fájlt a következő tartalommal:

```
REACT_APP_WEBHOOK_URL=http://your-webhook-url/webhook/
```

Lokális fejlesztés esetén alapértelmezetten a `http://n8nalfa.hwnet.local:5678/webhook/` címet használja. 