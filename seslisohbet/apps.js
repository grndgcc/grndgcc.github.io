// Owlbear Rodeo kütüphanesini doğru şekilde projeye dahil ediyoruz
import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@3.2.0/+esm";

let currentRolls = { base: [], skill: [], gear:[] };
let hasPushed = false;
let playerName = "Oyuncu";

// Tamamen adil (Kriptografik) 6 yüzlü zar atma fonksiyonu
function getFairD6() {
    const array = new Uint32Array(1);
    // Modulo sapmasını önlemek için geçerli maksimum değeri buluyoruz
    const maxValid = 4294967295 - (4294967295 % 6);
    let random;
    do {
        window.crypto.getRandomValues(array);
        random = array[0];
    } while (random >= maxValid); // Sapma yaratacak aralıktaysa tekrar üret
    return (random % 6) + 1;
}

function rollDicePool(count) {
    let pool =[];
    for (let i = 0; i < count; i++) pool.push(getFairD6());
    return pool;
}

function countSuccesses(rolls) {
    return rolls.base.filter(r => r === 6).length +
           rolls.skill.filter(r => r === 6).length +
           rolls.gear.filter(r => r === 6).length;
}

function updateUI() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    const drawDice = (type, rolls, color) => {
        if (rolls.length === 0) return;
        const row = document.createElement('div');
        row.className = 'dice-row';
        rolls.forEach(r => {
            const die = document.createElement('div');
            die.className = `die ${color}`;
            // YZE'de 6 başarı, Temel/Eşya için 1 ise özel durumdur
            if (r === 6) die.classList.add('success');
            if (r === 1 && (type === 'base' || type === 'gear')) die.classList.add('bane');
            die.textContent = r;
            row.appendChild(die);
        });
        resultsDiv.appendChild(row);
    }

    drawDice('base', currentRolls.base, 'die-base');
    drawDice('skill', currentRolls.skill, 'die-skill');
    drawDice('gear', currentRolls.gear, 'die-gear');

    const totalSuccesses = countSuccesses(currentRolls);
    const successText = document.createElement('h3');
    successText.textContent = `Toplam Başarı: ${totalSuccesses}`;
    resultsDiv.appendChild(successText);
}

function broadcastRoll(isPush) {
    const totalSuccesses = countSuccesses(currentRolls);
    
    // Bildirim metni oluştur
    let msg = `${playerName} ${isPush ? 'zarları zorladı (PUSH)!' : 'zar attı!'} -> ${totalSuccesses} BAŞARI.\n`;
    if(currentRolls.base.length > 0) msg += `Temel: [${currentRolls.base.join(',')}] `;
    if(currentRolls.skill.length > 0) msg += `Yetenek: [${currentRolls.skill.join(',')}] `;
    if(currentRolls.gear.length > 0) msg += `Eşya: [${currentRolls.gear.join(',')}]`;

    const payload = { message: msg, successes: totalSuccesses };

    // Diğer oyunculara (Arka plan dosyasına) gönder
    OBR.broadcast.sendMessage('yze-roll-event', payload);
    // Zar atanın kendi ekranında göster
    OBR.notification.show(msg, totalSuccesses > 0 ? "SUCCESS" : "WARNING");
}

OBR.onReady(async () => {
    try {
        playerName = await OBR.player.getName() || "Oyuncu";
    } catch(e) {
        console.log("İsim alınamadı, Oyuncu kullanılacak.");
    }

    document.getElementById('rollBtn').addEventListener('click', () => {
        const baseCount = parseInt(document.getElementById('baseDice').value) || 0;
        const skillCount = parseInt(document.getElementById('skillDice').value) || 0;
        const gearCount = parseInt(document.getElementById('gearDice').value) || 0;

        if (baseCount === 0 && skillCount === 0 && gearCount === 0) return;

        currentRolls.base = rollDicePool(baseCount);
        currentRolls.skill = rollDicePool(skillCount);
        currentRolls.gear = rollDicePool(gearCount);

        hasPushed = false;
        document.getElementById('pushBtn').disabled = false;

        updateUI();
        broadcastRoll(false);
    });

    document.getElementById('pushBtn').addEventListener('click', () => {
        if (hasPushed) return;

        // YZE Zorlama Kuralları: Başarılar (6) ve zararlı 1'ler (Temel ve Eşya) tutulur, gerisi yeniden atılır.
        currentRolls.base = currentRolls.base.map(r => (r === 6 || r === 1) ? r : getFairD6());
        currentRolls.skill = currentRolls.skill.map(r => (r === 6) ? r : getFairD6());
        currentRolls.gear = currentRolls.gear.map(r => (r === 6 || r === 1) ? r : getFairD6());

        hasPushed = true;
        document.getElementById('pushBtn').disabled = true;

        updateUI();
        broadcastRoll(true);
    });
});
