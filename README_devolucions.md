# Calculadora de Devolucions de Bitllets de Transport

## 📋 Descripció

Aplicació web per calcular la millor combinació d'operacions (anul·lació i compra de bitllets) per obtenir una devolució específica en màquines expendedores de bitllets de transport públic.

El sistema troba automàticament la combinació òptima de bitllets a anul·lar i comprar per aconseguir l'import desitjat, utilitzant el mínim nombre de bitllets possible (màxim 5 per operació).

## 🎯 Funcionalitats

- ✅ Càlcul automàtic de combinacions simples (1 operació)
- ✅ Càlcul de combinacions dobles (2 operacions) quan no hi ha solució simple
- ✅ Optimització per minimitzar el nombre de bitllets utilitzats
- ✅ Validació d'imports (rang: 0.05€ - 10€)
- ✅ Interfície intuïtiva amb taules de resultats
- ✅ Suport per a 12 tipus diferents de bitllets

## 🚀 Instal·lació i Ús

### Requisits previs
- Navegador web modern (Chrome, Firefox, Safari, Edge)
- No requereix servidor backend

### Ús
1. Clona o descarrega el repositori
2. Obre l'arxiu HTML principal en un navegador
3. Introdueix l'import desitjat (entre 0.05€ i 10€)
4. Fes clic a "Calcular"
5. Revisa el resultat amb les operacions a realitzar

## 📊 Tipus de Bitllets Suportats

| Tipus de Bitllet | Zones | Preu |
|-----------------|-------|------|
| SENZILL | 1Z | 2.90€ |
| SENZILL | 2Z | 4.15€ |
| SENZILL | 3Z | 5.40€ |
| PENSIONISTA "A" 75% | 1Z | 0.75€ |
| PENSIONISTA "A" 75% | 2Z | 1.05€ |
| PENSIONISTA "A" 75% | 3Z | 1.35€ |
| F.N. CAT GEN 20% | 1Z | 2.30€ |
| F.N. CAT GEN 20% | 2Z | 3.30€ |
| F.N. CAT GEN 20% | 3Z | 4.30€ |
| F.N. CAT ESP 50% | 1Z | 1.45€ |
| F.N. CAT ESP 50% | 2Z | 2.10€ |
| F.N. CAT ESP 50% | 3Z | 2.70€ |

## 🏗️ Arquitectura del Codi

### Estructura de Fitxers
```
projecte/
├── index.html              # Interfície d'usuari
├── calculadora-devolucions.js  # Lògica principal
├── styles.css              # Estils (opcional)
└── README.md              # Aquesta documentació
```

### Components Principals

#### 1. Objecte `bitllets`
Diccionari que emmagatzema tots els tipus de bitllets disponibles i els seus preus.

```javascript
const bitllets = {
    "SENZILL (1Z)": 2.90,
    "PENSIONISTA \"A\" 75% (1Z)": 0.75,
    // ...
};
```

#### 2. Event Listener Principal
Gestiona l'enviament del formulari i coordina el flux de l'aplicació.

```javascript
formulari.addEventListener('submit', function (e) {
    // Validació, càlcul i visualització de resultats
});
```

## 🔧 Funcions Principals

### `trobarCombinacio(importObjectiu)`

**Propòsit:** Troba la millor combinació de bitllets per aconseguir l'import objectiu.

**Paràmetres:**
- `importObjectiu` (Number): Import en euros que es vol obtenir

**Retorn:**
- Object amb la solució trobada, o `null` si no hi ha solució
- Pot retornar solució `simple` (1 operació) o `doble` (2 operacions)

**Algoritme:**

1. **Fase 1: Generació d'operacions possibles**
   - Genera totes les combinacions possibles d'operacions (anular X bitllets, comprar Y bitllets)
   - Limitació: màxim 5 bitllets per operació (qI + qJ ≤ 5)
   - Emmagatzema només la millor operació per cada import possible
   - Utilitza un `Map` amb clau `import.toFixed(2)` per rendiment òptim

2. **Fase 2: Cerca de solució simple**
   - Comprova si l'import objectiu existeix directament al Map d'operacions
   - Si existeix, retorna aquesta operació com a solució simple

3. **Fase 3: Cerca de solució doble**
   - Itera sobre totes les operacions possibles
   - Per cada operació, calcula l'import restant necessari
   - Busca si aquest import restant també existeix com a operació
   - Selecciona la combinació que utilitza menys bitllets en total

**Complexitat temporal:** O(n⁴) per la generació inicial, O(n²) per la cerca doble

**Exemple de retorn (simple):**
```javascript
{
    tipus: "simple",
    import: 1.65,
    anullar: { quantitat: 2, tipus: "SENZILL (1Z)", valor: 5.80 },
    comprar: { quantitat: 1, tipus: "SENZILL (2Z)", valor: 4.15 }
}
```

**Exemple de retorn (doble):**
```javascript
{
    tipus: "doble",
    import: 3.50,
    operacio1: { import: 2.15, anullar: {...}, comprar: {...} },
    operacio2: { import: 1.35, anullar: {...}, comprar: {...} }
}
```

---

### `generarTaula(combinacio)`

**Propòsit:** Genera el HTML de la taula de resultats amb les operacions a realitzar.

**Paràmetres:**
- `combinacio` (Object): Objecte amb la solució trobada

**Retorn:**
- String amb el codi HTML generat

**Funcionament:**
- Diferencia entre solucions simples i dobles
- Per a solucions dobles, mostra advertència i separa en PAS 1 i PAS 2
- Genera taules amb columnes: Acció, Quantitat, Tipus
- Inclou càlcul visual de l'operació: `( + X€ - Y€ )`

---

### `generarTaulaPart(op)`

**Propòsit:** Genera el HTML per a una operació individual (utilitzada per `generarTaula`).

**Paràmetres:**
- `op` (Object): Dades d'una operació amb estructura `{ import, anullar, comprar }`

**Retorn:**
- String amb HTML de la taula i informació de l'operació

---

### `generarTextOperacio(op)`

**Propòsit:** Genera el text explicatiu de l'operació matemàtica.

**Paràmetres:**
- `op` (Object): Dades d'una operació

**Retorn:**
- String amb format: `( + 5.80€ - 4.15€ )`

---

### `generarFila(accio, quantitat, tipus)`

**Propòsit:** Genera una fila de taula HTML.

**Paràmetres:**
- `accio` (String): "Anulꞏlar" o "Comprar"
- `quantitat` (Number): Quantitat de bitllets
- `tipus` (String): Tipus de bitllet

**Retorn:**
- String amb HTML de la fila (`<tr>...</tr>`)

---

### Funcions de Visualització

#### `mostraError(missatge)`
Mostra un missatge d'error a la interfície.

#### `ocultaError()`
Amaga el div d'errors.

#### `mostraResultat()`
Fa visible la secció de resultats.

#### `ocultaResultat()`
Amaga la secció de resultats.

## 🎨 Exemples d'Ús

### Exemple 1: Solució Simple
**Input:** 1.65€

**Output:**
```
Acció      Quantitat  Tipus
─────────────────────────────────
Anulꞏlar   2          SENZILL (1Z)
Comprar    1          SENZILL (2Z)

Total: 1.65 €
( + 5.80€ - 4.15€ )
```

### Exemple 2: Solució Doble
**Input:** 3.50€

**Output:**
```
⚠️ CAL FER 2 OPERACIONS

PAS 1:
[Taula operació 1]
Total: 2.15 €

PAS 2:
[Taula operació 2]
Total: 1.35 €

TOTAL FINAL: 3.50 €
```

## 🔍 Optimitzacions Implementades

1. **Map per emmagatzematge:** Ús de `Map` en lloc d'arrays per a cerca O(1)
2. **Claus amb precisió fixa:** Ús de `.toFixed(2)` per evitar problemes de precisió de decimals
3. **Early termination:** Ignora combinacions que superin 5 bitllets
4. **Millor solució per import:** Només guarda la combinació amb menys bitllets per cada import
5. **Filtratge de resultats negatius:** Ignora operacions amb resultat ≤ 0

## ⚠️ Limitacions Conegudes

- Màxim 5 bitllets per operació individual
- No troba solucions que requereixin més de 2 operacions
- Import màxim: 10€
- Precisió decimal limitada a 2 decimals

## 🛠️ Millores Futures Proposades

- [ ] Afegir suport per més de 2 operacions
- [ ] Implementar caché de resultats freqüents
- [ ] Afegir historial de càlculs
- [ ] Exportar resultats a PDF
- [ ] Mode fosc/clar
- [ ] Internacionalització (i18n)
- [ ] Tests unitaris amb Jest
- [ ] Versió Progressive Web App (PWA)

## 🧪 Testing

### Test Manual
1. Introdueix 1.65€ → Hauria de retornar solució simple
2. Introdueix 0.01€ → Hauria de mostrar error
3. Introdueix 15€ → Hauria de mostrar error
4. Introdueix text → Hauria de mostrar error

### Tests Recomanats per Implementar
```javascript
// Exemples amb framework de testing
describe('trobarCombinacio', () => {
    test('retorna solució simple per 1.65€', () => {
        const result = trobarCombinacio(1.65);
        expect(result.tipus).toBe('simple');
    });
    
    test('retorna null per imports impossibles', () => {
        const result = trobarCombinacio(0.01);
        expect(result).toBeNull();
    });
});
```

## 📝 Contribució

1. Fes un fork del projecte
2. Crea una branca per la teva funcionalitat (`git checkout -b feature/nova-funcionalitat`)
3. Commit els canvis (`git commit -m 'Afegeix nova funcionalitat'`)
4. Push a la branca (`git push origin feature/nova-funcionalitat`)
5. Obre un Pull Request

### Estàndards de Codi
- Utilitza camelCase per variables i funcions
- Comenta el codi complex
- Segueix les convencions de JavaScript ES6+
- Manté la coherència amb l'estil existent

## 📄 Llicència

Aquest projecte està sota llicència MIT. Consulta l'arxiu `LICENSE` per més detalls.

## 👥 Autors

- Desenvolupador principal: [El teu nom]
- Data de creació: 2024

## 📞 Contacte

Per preguntes o suggeriments:
- Email: [el-teu-email@example.com]
- Issues: [URL del repositori]/issues

---

**Versió:** 1.0.0  
**Última actualització:** Febrer 2026
