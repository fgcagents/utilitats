document.addEventListener("DOMContentLoaded", () => {
    // Calculadora de devolucions per a bitllets de transport
    
    const bitllets = {
        "SENZILL (1Z)": 2.90,
        "SENZILL (2Z)": 4.15,
        "SENZILL (3Z)": 5.40,
        "PENSIONISTA \"A\" 75% (1Z)": 0.75,
        "PENSIONISTA \"A\" 75% (2Z)": 1.05,
        "PENSIONISTA \"A\" 75% (3Z)": 1.35,
        "F.N. CAT GEN 20% (1Z)": 2.30,
        "F.N. CAT GEN 20% (2Z)": 3.30,
        "F.N. CAT GEN 20% (3Z)": 4.30,
        "F.N. CAT ESP 50% (1Z)": 1.45,
        "F.N. CAT ESP 50% (2Z)": 2.10,
        "F.N. CAT ESP 50% (3Z)": 2.70,
    };

    const formulari = document.getElementById('formulari');
    const errorDiv = document.getElementById('error');
    const resultatDiv = document.getElementById('resultat');
    const detallsDiv = document.getElementById('detalls');

    formulari.addEventListener('submit', function (e) {
        e.preventDefault();
        const importObjectiu = parseFloat(document.getElementById('import').value);

        // Validació de l'import
        if (isNaN(importObjectiu) || importObjectiu <= 0 || importObjectiu > 10) {
            mostraError('Si us plau, introdueix un import vàlid entre 0,05 i 10 €.');
            ocultaResultat();
            return;
        }

        ocultaError();
        mostraResultat();
        detallsDiv.innerHTML = '<p>Calculant...</p>';

        // Busca la millor combinació
        const combinacio = trobarCombinacio(importObjectiu);

        if (combinacio) {
            detallsDiv.innerHTML = generarTaula(combinacio);
        } else {
            detallsDiv.innerHTML = '<strong>Error:</strong> No s\'ha trobat cap combinació possible per a aquest import (màxim 5 bitllets).';
        }
    });

    function mostraError(missatge) {
        errorDiv.textContent = missatge;
        errorDiv.style.display = 'block';
    }

    function ocultaError() {
        errorDiv.style.display = 'none';
    }

    function mostraResultat() {
        resultatDiv.style.display = 'block';
    }

    function ocultaResultat() {
        resultatDiv.style.display = 'none';
    }


    /**
     * Troba la millor combinació de bitllets per arribar al import objectiu
     * Primer intenta una sola operació, després dues operacions
     */
    function trobarCombinacio(importObjectiu) {
        const nomsBitllets = Object.keys(bitllets);
        const preusBitllets = Object.values(bitllets);

        // 1. Generem totes les operacions simples possibles (màxim 5 bitllets)
        const operacionsPossibles = new Map();

        for (let i = 0; i < nomsBitllets.length; i++) {
            for (let j = 0; j < nomsBitllets.length; j++) {
                for (let qI = 1; qI <= 5; qI++) {
                    for (let qJ = 1; qJ <= 5; qJ++) {
                        
                        if (qI + qJ > 5) continue;

                        const total = preusBitllets[i] * qI - preusBitllets[j] * qJ;
                        
                        // Ignorar resultats negatius o zero
                        if (total <= 0) continue;
                        
                        const totalKey = total.toFixed(2);

                        const novaOperacio = {
                            quantitatTotal: qI + qJ,
                            dades: {
                                import: total,
                                anullar: { quantitat: qI, tipus: nomsBitllets[i], valor: preusBitllets[i] * qI },
                                comprar: { quantitat: qJ, tipus: nomsBitllets[j], valor: preusBitllets[j] * qJ }
                            }
                        };

                        if (!operacionsPossibles.has(totalKey) || 
                            operacionsPossibles.get(totalKey).quantitatTotal > novaOperacio.quantitatTotal) {
                            operacionsPossibles.set(totalKey, novaOperacio);
                        }
                    }
                }
            }
        }

        // 2. Intentem trobar la solució en UNA sola operació
        const objectiuKey = importObjectiu.toFixed(2);
        if (operacionsPossibles.has(objectiuKey)) {
            const op = operacionsPossibles.get(objectiuKey);
            return {
                tipus: "simple",
                ...op.dades
            };
        }

        // 3. Si no existeix, busquem una ALTERNATIVA DOBLE
        let millorDoble = null;
        let minBitlletsTotal = Infinity;

        for (const [val1Str, op1] of operacionsPossibles) {
            const val1 = parseFloat(val1Str);
            const necessari = importObjectiu - val1;

            // Optimització: el que falta ha de ser positiu
            if (necessari <= 0) continue;

            const necessariKey = necessari.toFixed(2);

            if (operacionsPossibles.has(necessariKey)) {
                const op2 = operacionsPossibles.get(necessariKey);
                const totalBitllets = op1.quantitatTotal + op2.quantitatTotal;

                if (totalBitllets < minBitlletsTotal) {
                    minBitlletsTotal = totalBitllets;
                    millorDoble = {
                        tipus: "doble",
                        import: importObjectiu,
                        operacio1: op1.dades,
                        operacio2: op2.dades
                    };
                }
            }
        }

        return millorDoble;
    }


    /**
     * Genera la taula HTML amb el resultat de la combinació
     */
    function generarTaula(combinacio) {
        let html = '';

        function generarFila(accio, quantitat, tipus) {
            return `<tr><td>${accio}</td><td>${quantitat}</td><td>${tipus}</td></tr>`;
        }

        function generarTextOperacio(op) {
            // Genera el text: ( + 5.80€ - 4.15€ )
            const valAnul = op.anullar.valor.toFixed(2);
            const valComp = op.comprar.valor.toFixed(2);
            return `( + ${valAnul}€ - ${valComp}€ )`;
        }

        function generarTaulaPart(op) {
            const textOperacio = generarTextOperacio(op);
            return `
                <table>
                    <thead>
                        <tr>
                            <th>Acció</th>
                            <th>Quantitat</th>
                            <th>Tipus</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generarFila('Anul·lar', op.anullar.quantitat, op.anullar.tipus)}
                        ${generarFila('Comprar', op.comprar.quantitat, op.comprar.tipus)}
                    </tbody>
                </table>
                <p class="import-total"><strong>Total:</strong> ${op.import.toFixed(2)} €</p>
                <p class="operacio">${textOperacio}</p>
            `;
        }

        if (combinacio.tipus === 'simple') {
            html += generarTaulaPart(combinacio);
        } else if (combinacio.tipus === 'doble') {
            html += `<p style="color:#d35400; font-weight:bold; margin-bottom:10px;">⚠️ CAL FER 2 OPERACIONS</p>`;
            
            html += `<p style="margin:5px 0;"><strong>PAS 1:</strong></p>`;
            html += generarTaulaPart(combinacio.operacio1);
            
            html += `<p style="margin:15px 0 5px 0; border-top:1px dashed #ccc; padding-top:10px;"><strong>PAS 2:</strong></p>`;
            html += generarTaulaPart(combinacio.operacio2);
            
            html += `<p class="import-total" style="margin-top:15px; font-size: 1.1em; border-top: 2px solid #333; padding-top: 5px;"><strong>TOTAL FINAL:</strong> ${combinacio.import.toFixed(2)} €</p>`;
        }

        return html;
    }


    // Actualitza l'any del footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
});


