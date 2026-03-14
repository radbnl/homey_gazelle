# Gazelle Connected - Homey App

Monitor je Gazelle e-bike batterij en locatie in Homey.

## Features

- **Batterij percentage** - Zie hoeveel % je batterij nog heeft
- **Oplaadstatus** - Weet wanneer je fiets aan de lader hangt
- **Bereik** - Geschatte afstand die je nog kunt fietsen
- **Kilometerteller** - Totaal aantal km gereden
- **Locatie** - GPS locatie van je fiets
- **Assist niveau** - Huidige ondersteuningsstand

## Installatie voor gebruikers

### Stap 1: App installeren

De app is nog niet in de Homey App Store. Installeer via de CLI:

```bash
git clone https://github.com/radbnl/homey_gazelle.git
cd homey_gazelle
npm install
npx homey login
npx homey app install
```

### Stap 2: Fiets toevoegen

1. Open de Homey app op je telefoon
2. Ga naar **Apparaten** > **+** > **Gazelle Connected**
3. Klik op **"Inloggen met Gazelle"**
4. Log in met je Gazelle Connected account in de browser die opent
5. Na het inloggen kom je op een pagina die mogelijk een fout toont - **dit is normaal**
6. Kopieer de **volledige URL** uit je adresbalk (begint met `https://consumer.login.pon.bike/ios/...`)
7. Plak deze URL in de Homey app en klik **"Doorgaan"**
8. Selecteer je fiets en voeg toe

## Flow Cards

### Triggers
- Batterij percentage veranderd (met percentage token)
- Batterij bijna leeg (<20%)
- Opladen gestart
- Opladen gestopt

### Conditions
- Fiets is aan het opladen
- Batterij is boven X%

## Instellingen

- **Update interval** - Hoe vaak de status wordt opgehaald (standaard: 15 minuten)

## Token verloop

De access token verloopt na 24 uur, maar de app refresht deze automatisch met de refresh token. Zolang de app draait hoef je niet opnieuw in te loggen.

## Development

```bash
# Run met live logs
npx homey app run

# Alleen installeren
npx homey app install

# Valideren
npx homey app validate
```

## Technische details

- Homey SDK 3
- Gebruikt de Gazelle/Pon.Bike API (reverse engineered)
- OAuth2 PKCE authenticatie via Auth0
- Automatische token refresh

## API Documentatie

Zie [docs/API.md](docs/API.md) voor volledige API documentatie inclusief:
- Alle beschikbare endpoints
- Authenticatie details
- Request/response voorbeelden
- Ongebruikte endpoints voor toekomstige features (flash lights, theft detection, etc.)

## Waarom de callback URL?

Gazelle's OAuth systeem staat alleen hun eigen redirect URI toe (`https://consumer.login.pon.bike/ios/...`). We kunnen hier geen eigen callback registreren. Daarom moet je de URL handmatig kopiëren na het inloggen. De app haalt vervolgens automatisch de tokens op.

## Disclaimer

**Deze app is niet geaffilieerd met Gazelle of Pon.Bike.**

- Dit is een onofficiële app gebaseerd op reverse-engineered APIs
- Gebruik op eigen risico
- De API kan wijzigen zonder waarschuwing, waardoor de app kan stoppen met werken
- Je bent zelf verantwoordelijk voor het gebruik van je account
- Niet bedoeld voor commercieel gebruik

### Legaliteit

Reverse engineering voor interoperabiliteit is toegestaan onder EU-recht. Deze app:
- Haalt alleen je eigen data op met je eigen account
- Omzeilt geen beveiligingsmaatregelen
- Belast de servers niet meer dan normaal gebruik
- Is open source en transparant

## Licentie

[Unlicense](https://unlicense.org) - Public Domain. Doe ermee wat je wilt.
