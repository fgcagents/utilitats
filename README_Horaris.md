# Consulta d'Horaris de Trens FGC

## 📋 Descripció

Aplicació web per consultar en temps real els horaris de sortida dels trens de Ferrocarrils de la Generalitat de Catalunya (FGC) des de qualsevol estació de la xarxa. L'aplicació utilitza les dades obertes de FGC i implementa un sistema de caché intel·ligent per optimitzar el rendiment i reduir les peticions a l'API.

## 🎯 Funcionalitats

- ✅ Consulta d'horaris en temps real des de l'API de dades obertes de FGC
- ✅ Sistema de caché local automàtic (actualització diària)
- ✅ Filtratge per línia de tren (S1, S2, R5, R6, etc.)
- ✅ Selecció d'hora personalitzada o hora actual automàtica
- ✅ Configuració del nombre de trens a mostrar
- ✅ Correcció automàtica d'hores post-mitjanit (24:25 → 00:25)
- ✅ Neteja automàtica de caché antic
- ✅ Indicador visual de fonts de dades (API/Caché)
- ✅ Opció de forçar actualització manual

## 🚀 Instal·lació i Ús

### Requisits previs
- Navegador web modern amb suport per `localStorage`
- Connexió a Internet (per carregar dades de l'API FGC)

### Configuració
1. Clona o descarrega el repositori
2. Obre l'arxiu `index.html` en un navegador
3. No requereix configuració de servidor ni dependències externes

### Ús bàsic
1. Introdueix el codi de l'estació (exemple: `TG`, `SA`, `NA`)
2. (Opcional) Selecciona una línia específica
3. (Opcional) Selecciona una hora personalitzada
4. (Opcional) Indica el nombre de trens a mostrar (per defecte: 8)
5. Fes clic a "Consultar Horaris"

## 📊 API Utilitzada

### Endpoint principal
```
https://dadesobertes.fgc.cat/api/explore/v2.1/catalog/datasets/viajes-de-hoy/records
```

### Paràmetres de consulta
- `limit`: Nombre de registres per pàgina (màxim: 100)
- `offset`: Desplaçament per paginació
- `where`: Filtre per estació (`parent_station="XX"`)

### Estructura de resposta
```json
{
  "results": [
    {
      "parent_station": "TG",
      "stop_name": "Terrassa-Rambla",
      "route_short_name": "S1",
      "trip_headsign": "Pl. Catalunya",
      "departure_time": "08:45"
    }
  ]
}
```

## 🏗️ Arquitectura del Codi

### Estructura de Fitxers
```
projecte/
├── index.html          # Interfície d'usuari
├── index.js            # Lògica principal (aquest fitxer)
├── styles.css          # Estils visuals
└── README.md           # Aquesta documentació
```

### Flux de dades

```
Usuario → Formulari → fetchTrainData()
                           ↓
                    getStationData()
                           ↓
                    ┌──────┴──────┐
                    ↓             ↓
            Cache Local      API FGC
                    ↓             ↓
                    └──────┬──────┘
                           ↓
                  Processament i filtratge
                           ↓
                    displayTrains()
                           ↓
                      Visualització
```

## 🔧 Funcions Principals

### `getCurrentTime()`

**Propòsit:** Obtenir l'hora actual del sistema en format HH:MM.

**Paràmetres:** Cap

**Retorn:** 
- `String`: Hora en format `HH:MM` (exemple: `"14:35"`)

**Exemple:**
```javascript
const hora = getCurrentTime(); // "14:35"
```

---

### `getCurrentDate()`

**Propòsit:** Obtenir la data actual en format ISO (YYYY-MM-DD).

**Paràmetres:** Cap

**Retorn:** 
- `String`: Data en format `YYYY-MM-DD` (exemple: `"2026-02-04"`)

**Funcionament:**
- Utilitza `Date.toISOString()` i extreu la part de la data
- Aquesta data s'utilitza com a clau per validar el caché

**Exemple:**
```javascript
const data = getCurrentDate(); // "2026-02-04"
```

---

### `corregirHora(horaStr)`

**Propòsit:** Corregir hores que superen les 24 hores (format utilitzat per FGC per hores post-mitjanit).

**Paràmetres:**
- `horaStr` (String): Hora en format `HH:MM`

**Retorn:** 
- `String`: Hora corregida en format `HH:MM`

**Funcionament:**
- Si les hores són ≥ 24, resta 24 hores
- Manté els minuts inalterats
- Aplica padding de zeros si cal

**Exemples:**
```javascript
corregirHora("24:15"); // "00:15"
corregirHora("25:30"); // "01:30"
corregirHora("23:45"); // "23:45" (no canvia)
```

---

### `getStationData(stationCode)`

**Propòsit:** Gestionar la càrrega de dades amb sistema de caché intel·ligent.

**Paràmetres:**
- `stationCode` (String): Codi de l'estació (exemple: `"TG"`, `"SA"`)

**Retorn:** 
- `Promise<Array>`: Array amb tots els registres de trens

**Flux de decisió:**
1. Comprova si existeix caché vàlid per a la data actual
2. Si existeix → Retorna dades del `localStorage`
3. Si no existeix → Crida `fetchAllRecordsFromAPI()`
4. Guarda les noves dades al caché amb timestamp de data

**Claus de localStorage:**
- `fgc_station_${stationCode}`: Dades dels trens
- `fgc_station_${stationCode}_date`: Data de la darrera actualització

**Exemple:**
```javascript
const trens = await getStationData("TG");
console.log(trens.length); // 245 (tots els trens del dia)
```

**Avantatges:**
- Redueix càrrega de l'API
- Millora velocitat de resposta (caché local)
- Actualització automàtica diària

---

### `fetchAllRecordsFromAPI(stationCode)`

**Propòsit:** Obtenir TOTS els registres de l'API utilitzant paginació.

**Paràmetres:**
- `stationCode` (String): Codi de l'estació

**Retorn:** 
- `Promise<Array>`: Array amb tots els registres obtinguts

**Funcionament:**
1. Fa peticions paginades amb `limit=100`
2. Incrementa `offset` de 100 en 100
3. Continua fins que:
   - Respon amb menys de 100 resultats (fi de dades)
   - Arriba a 1000 registres (límit de seguretat)
   - Es produeix un error

**Exemple de flux:**
```
Petició 1: offset=0, limit=100   → 100 resultats
Petició 2: offset=100, limit=100 → 100 resultats
Petició 3: offset=200, limit=100 → 45 resultats → FI
Total: 245 trens
```

**Complexitat:** O(n/100) on n és el nombre total de registres

**Gestió d'errors:**
- Captura excepcions de xarxa
- Retorna tots els resultats obtinguts fins al moment de l'error

---

### `cleanOldCache()`

**Propòsit:** Netejar automàticament les dades de caché de dies anteriors.

**Paràmetres:** Cap

**Retorn:** `void`

**Funcionament:**
1. Itera sobre totes les claus de `localStorage`
2. Identifica claus amb patró `fgc_station_*_date`
3. Compara la data emmagatzemada amb la data actual
4. Esborra les claus antigues (dades + timestamp)

**Exemple de log:**
```
🗑️ Cache antic netejat (3 estacions)
```

**Quan s'executa:**
- Automàticament al carregar la pàgina
- Evita que el `localStorage` s'ompli amb dades antigues

---

### `fetchTrainData(stationCode, trainCount, selectedTime, lineName)`

**Propòsit:** Funció principal per obtenir i mostrar els horaris de trens.

**Paràmetres:**
- `stationCode` (String): Codi de l'estació (es converteix a majúscules)
- `trainCount` (Number): Nombre de trens a mostrar
- `selectedTime` (String): Hora de consulta (format `HH:MM`) o `null` per hora actual
- `lineName` (String): Nom de la línia per filtrar (opcional, `""` per totes)

**Retorn:** 
- `Promise<void>`: Actualitza el DOM directament

**Flux detallat:**

1. **Normalització:**
   - Converteix `stationCode` a majúscules
   - Determina si es carregarà des de caché o API

2. **Càrrega de dades:**
   - Mostra indicador de càrrega
   - Crida `getStationData(stationCode)`
   - Gestió especial per l'estació `NA` (cerca per nom)

3. **Processament temporal:**
   - Converteix hora seleccionada a minuts des de mitjanit
   - Ajusta hores post-mitjanit (+1440 minuts)
   - Filtra trens futurs respecte l'hora seleccionada

4. **Filtratge:**
   - Per hora de sortida (≥ hora seleccionada)
   - Per línia (si s'ha especificat)

5. **Ordenació:**
   - Ordena per hora de sortida ascendent

6. **Visualització:**
   - Crida `displayTrains()` amb els resultats

**Conversió temporal:**
```javascript
// Exemple: 14:35 → 14*60 + 35 = 875 minuts
// Exemple: 01:15 → 1*60 + 15 = 75 (+1440 = 1515 minuts)
```

**Gestió d'errors:**
- Mostra missatge d'error en cas de fallida
- Suggereix verificar el codi d'estació

---

### `displayTrains(trains, trainCount, isFromCache)`

**Propòsit:** Renderitzar la llista de trens a la interfície.

**Paràmetres:**
- `trains` (Array): Array d'objectes de tren
- `trainCount` (Number): Nombre màxim de trens a mostrar
- `isFromCache` (Boolean): Indica si les dades provenen del caché

**Retorn:** `void`

**Estructura HTML generada:**
```html
<div class="train-schedule">
  <div style="...">⚡ Dades del cache (actualitzades avui)</div>
  <div class="train">
    <div class="line-icon s1">S1</div>
    <div class="destination">Pl. Catalunya</div>
    <div class="time">14:35</div>
  </div>
  <!-- Més trens... -->
</div>
```

**Funcionament:**
1. Neteja el contingut anterior
2. Si no hi ha trens, mostra missatge informatiu
3. Si ve del caché, afegeix indicador visual verd
4. Itera sobre els primers `trainCount` trens
5. Crea elements DOM per cada tren amb:
   - Icona de línia amb classe CSS dinàmica
   - Destinació del tren
   - Hora de sortida corregida

**Classes CSS aplicades:**
- `.train`: Contenidor principal
- `.line-icon`: Icona de línia
- `.${route_short_name.toLowerCase()}`: Classe específica de línia (s1, s2, r5, etc.)
- `.destination`: Text de destinació
- `.time`: Hora de sortida

---

### `forceRefresh()`

**Propòsit:** Permetre a l'usuari forçar una actualització de dades esborrant el caché.

**Paràmetres:** Cap

**Retorn:** `void`

**Funcionament:**
1. Obté el codi d'estació del formulari
2. Esborra les claus de caché específiques de l'estació
3. Dispara automàticament el submit del formulari
4. Les dades es tornen a carregar des de l'API

**Exemple d'ús:**
```html
<button onclick="forceRefresh()">🔄 Actualitzar</button>
```

**Log generat:**
```
🔄 Cache esborrat. Carregant dades fresques...
```

---

### Event Listeners

#### Input de codi d'estació
```javascript
document.getElementById('station-code').addEventListener('input', function(e) {
    this.value = this.value.toUpperCase();
});
```
**Propòsit:** Convertir automàticament a majúscules mentre l'usuari escriu.

#### Submit del formulari
```javascript
document.getElementById('station-form').addEventListener('submit', function(event) {
    event.preventDefault();
    // Obtenció de valors i crida a fetchTrainData()
});
```
**Propòsit:** Gestionar l'enviament del formulari i iniciar la consulta.

**Valors per defecte:**
- `trainCount`: 8 trens
- `selectedTime`: Hora actual si no s'especifica
- `lineName`: Totes les línies si no s'especifica

---

## 📚 Helpers i Utilitats

### `timeToMinutes(timeStr)`
**Ubicació:** Funció anònima dins `fetchTrainData()`

**Propòsit:** Convertir hora HH:MM a minuts totals amb ajust post-mitjanit.

**Lògica:**
```javascript
const timeToMinutes = (timeStr) => {
    const [hh, mm] = timeStr.split(':').map(Number);
    let total = hh * 60 + mm;
    return total < 240 ? total + 1440 : total;
};
```

**Exemples:**
```javascript
timeToMinutes("14:30"); // 870
timeToMinutes("01:15"); // 1515 (75 + 1440)
timeToMinutes("23:45"); // 1425
```

**Justificació del llindar 240:**
- 240 minuts = 04:00
- Trens abans de les 04:00 es consideren del dia anterior (post-mitjanit)
- S'afegeixen 1440 minuts (24 hores) per ordenació correcta

---

## 🎨 Exemples d'Ús

### Exemple 1: Consulta bàsica
```javascript
// Usuari introdueix: Codi = "TG"
// Sistema executa:
fetchTrainData("TG", 8, null, "");

// Resultat: 
// - Mostra 8 propers trens des de Terrassa-Rambla
// - Utilitza hora actual
// - Totes les línies
```

### Exemple 2: Consulta amb filtre de línia
```javascript
// Usuari introdueix: 
// Codi = "SA", Línia = "S2", Nombre = 5
fetchTrainData("SA", 5, null, "S2");

// Resultat:
// - Mostra 5 propers trens S2 des de Sabadell
```

### Exemple 3: Consulta amb hora personalitzada
```javascript
// Usuari introdueix:
// Codi = "PG", Hora = "18:30", Nombre = 10
fetchTrainData("PG", 10, "18:30", "");

// Resultat:
// - Mostra 10 trens a partir de les 18:30
```

### Exemple 4: Dades del caché
```javascript
// Primera consulta del dia:
getStationData("TG"); 
// → Carrega de l'API (2-3 segons)
// → Guarda al localStorage

// Segona consulta (mateix dia):
getStationData("TG");
// → Carrega del caché (<100ms)
// → Mostra indicador "⚡ Dades del cache"
```

---

## 🔍 Optimitzacions Implementades

### 1. Sistema de Caché Local
- **Benefici:** Redueix temps de càrrega de 2-3s a <100ms
- **Estratègia:** Caché diari amb clau de data
- **Memòria:** Utilitza `localStorage` del navegador

### 2. Paginació Eficient
- **Benefici:** Obté TOTES les dades sense saturar l'API
- **Estratègia:** Peticions de 100 en 100 registres
- **Límit de seguretat:** Màxim 1000 registres (10 pàgines)

### 3. Conversió Temporal Optimitzada
- **Benefici:** Comparacions i ordenació ràpides
- **Estratègia:** Convertir HH:MM a minuts totals una sola vegada
- **Complexitat:** O(1) per comparació

### 4. Neteja Automàtica de Caché
- **Benefici:** Evita acumulació de dades antigues
- **Estratègia:** Execució automàtica al carregar la pàgina
- **Freqüència:** Diària

### 5. Gestió d'Errors Robusta
- **Benefici:** Millor experiència d'usuari en cas de fallades
- **Estratègia:** Try-catch en peticions, missatges informatius

---

## ⚠️ Limitacions Conegudes

### Tècniques
- **Caché limitat:** Depenent de `localStorage` (5-10MB per domini)
- **Actualització:** Només es refresca una vegada al dia automàticament
- **Paginació:** Màxim 1000 registres (limita estacions molt concorregudes)

### Funcionals
- **Estació NA:** Requereix cerca especial per nom (workaround)
- **Hores post-mitjanit:** Assumeix que <04:00 és dia següent
- **Sense offline:** Requereix connexió per primera càrrega del dia

### Rendiment
- **Primera càrrega:** Pot trigar 2-5 segons segons la mida de dades
- **localStorage:** Pot fallar si està desactivat o ple

---

## 🛠️ Millores Futures Proposades

### Funcionalitat
- [ ] Afegir geolocalització per detectar estació més propera
- [ ] Implementar notificacions push per trens seleccionats
- [ ] Afegir historial de consultes recents
- [ ] Mode favorits per estacions habituals
- [ ] Alertes de retards o incidències

### Tècnic
- [ ] Migrar a Service Workers per caché més robusta
- [ ] Implementar mode offline complet (PWA)
- [ ] Afegir IndexedDB per dades més grans
- [ ] Websockets per actualitzacions en temps real
- [ ] Compressió de dades al caché (gzip)

### UX/UI
- [ ] Mode fosc/clar
- [ ] Animacions de transició
- [ ] Gràfics de freqüència de trens
- [ ] Mapa interactiu de la xarxa
- [ ] Compartir horaris via URL

### Testing
- [ ] Tests unitaris amb Jest
- [ ] Tests d'integració amb Cypress
- [ ] Tests de rendiment amb Lighthouse
- [ ] Mock de l'API per desenvolupament local

---

## 🧪 Testing

### Tests Manuals Recomanats

#### Test 1: Caché funciona correctament
1. Consulta una estació (exemple: `TG`)
2. Observa el log: "⏳ Carregant dades de l'API..."
3. Consulta la mateixa estació
4. Observa el log: "✓ Dades carregades des del cache"

**Resultat esperat:** Segona càrrega molt més ràpida

#### Test 2: Filtre de línia
1. Consulta estació `SA` sense filtre
2. Observa múltiples línies (S1, S2, S55)
3. Consulta `SA` amb filtre `S2`
4. Observa només trens S2

**Resultat esperat:** Només trens de la línia seleccionada

#### Test 3: Hora personalitzada
1. Selecciona hora futura (exemple: 20:00)
2. Consulta una estació
3. Verifica que només mostra trens ≥ 20:00

**Resultat esperat:** Cap tren anterior a l'hora seleccionada

#### Test 4: Força actualització
1. Consulta una estació (carrega del caché)
2. Fes clic al botó "Actualitzar"
3. Observa el log: "🔄 Cache esborrat..."

**Resultat esperat:** Dades recarregades des de l'API

### Tests Unitaris Recomanats

```javascript
describe('Funcions auxiliars', () => {
    test('getCurrentTime retorna format HH:MM', () => {
        const time = getCurrentTime();
        expect(time).toMatch(/^\d{2}:\d{2}$/);
    });
    
    test('getCurrentDate retorna format YYYY-MM-DD', () => {
        const date = getCurrentDate();
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
    
    test('corregirHora gestiona hores >= 24', () => {
        expect(corregirHora("24:15")).toBe("00:15");
        expect(corregirHora("25:30")).toBe("01:30");
        expect(corregirHora("23:45")).toBe("23:45");
    });
});

describe('Sistema de caché', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('getStationData guarda al localStorage', async () => {
        await getStationData("TG");
        const cached = localStorage.getItem("fgc_station_TG");
        expect(cached).not.toBeNull();
    });
    
    test('getStationData utilitza caché vàlid', async () => {
        // Primera crida
        const spy = jest.spyOn(window, 'fetch');
        await getStationData("TG");
        const firstCallCount = spy.mock.calls.length;
        
        // Segona crida
        await getStationData("TG");
        const secondCallCount = spy.mock.calls.length;
        
        expect(secondCallCount).toBe(firstCallCount); // No ha fet més fetch
    });
});

describe('Conversió temporal', () => {
    test('timeToMinutes converteix correctament', () => {
        const timeToMinutes = (timeStr) => {
            const [hh, mm] = timeStr.split(':').map(Number);
            let total = hh * 60 + mm;
            return total < 240 ? total + 1440 : total;
        };
        
        expect(timeToMinutes("14:30")).toBe(870);
        expect(timeToMinutes("01:15")).toBe(1515);
        expect(timeToMinutes("00:00")).toBe(1440);
    });
});
```

---

## 📖 Glossari

- **FGC:** Ferrocarrils de la Generalitat de Catalunya
- **Caché:** Emmagatzematge temporal de dades per millorar el rendiment
- **localStorage:** API del navegador per emmagatzemar dades de forma persistent
- **Paginació:** Divisió de resultats en múltiples pàgines
- **Offset:** Desplaçament en una llista de resultats
- **Timestamp:** Marca temporal
- **Post-mitjanit:** Hores després de les 00:00 (00:00-03:59)

---

## 🔗 Referències

- **API FGC:** https://dadesobertes.fgc.cat/
- **Portal de dades obertes:** https://dadesobertes.fgc.cat/ca/inici
- **localStorage API:** https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

---

## 📝 Contribució

### Flux de treball
1. Fes un fork del projecte
2. Crea una branca (`git checkout -b feature/millora`)
3. Commit els canvis (`git commit -m 'Afegeix millora'`)
4. Push a la branca (`git push origin feature/millora`)
5. Obre un Pull Request

### Estàndards de codi
- **Nomenclatura:** camelCase per funcions i variables
- **Comentaris:** Documentar funcions complexes
- **ES6+:** Utilitzar sintaxi moderna de JavaScript
- **Consistència:** Seguir l'estil del codi existent
- **Testing:** Afegir tests per noves funcionalitats

### Checklist abans del PR
- [ ] El codi segueix els estàndards del projecte
- [ ] S'han afegit comentaris on cal
- [ ] S'han executat tests manuals
- [ ] No hi ha errors a la consola
- [ ] La funcionalitat ha estat testejada en múltiples navegadors

---

## 📄 Llicència

Aquest projecte està sota llicència MIT. Consulta l'arxiu `LICENSE` per més detalls.

---

## 👥 Autors i Crèdits

- **Desenvolupador principal:** [El teu nom]
- **Data de creació:** 2026
- **Dades proporcionades per:** Ferrocarrils de la Generalitat de Catalunya (FGC)

---

## 📞 Contacte i Suport

- **Issues:** [URL del repositori]/issues
- **Email:** [el-teu-email@example.com]
- **Documentació FGC:** https://dadesobertes.fgc.cat/

---

## 🔄 Historial de Versions

### v1.0.0 (Febrer 2026)
- ✅ Implementació inicial
- ✅ Sistema de caché local
- ✅ Paginació d'API
- ✅ Filtratge per línia i hora
- ✅ Neteja automàtica de caché

---

**Versió:** 1.0.0  
**Última actualització:** Febrer 2026  
**Estat:** Producció
