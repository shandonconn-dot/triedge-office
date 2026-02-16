/**
 * Pokemon Red/Blue Battle - ANIMATED
 * Real Gen 1 sprites + animations + menu interactions
 */

class PokemonBattleAnimated {
    constructor(canvas) {
        if (!canvas) {
            console.error('Canvas is null!');
            return;
        }
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.width = 160;
        this.height = 144;
        
        this.colors = {
            darkest: '#0f380f',
            dark: '#306230',
            light: '#8bac0f',
            lightest: '#9bbc0f'
        };
        
        this.enemy = {
            name: 'SQUIRTLE',
            level: 5,
            hp: 20,
            maxHp: 20,
            x: 96,
            y: 16,
            baseY: 16,
            bobOffset: 0
        };
        
        this.player = {
            name: 'CHARMANDER',
            level: 5,
            hp: 11,
            maxHp: 19,
            x: 8,
            y: 48,
            baseY: 48,
            bobOffset: 0
        };
        
        this.battleText = 'What will\nCHARMANDER do?';
        this.menuCursor = 0; // 0=FIGHT, 1=PKMN, 2=ITEM, 3=RUN
        this.frame = 0;
        this.attacking = false;
        this.attackFrame = 0;
        
        // Party screen state
        this.showingParty = false;
        this.partyCursor = 0;
        this.party = [
            { name: 'NIDORAN♂', level: 5, hp: 20, maxHp: 20 },
            { name: 'CHARMANDER', level: 13, hp: 35, maxHp: 35 },
            { name: 'RATTATA', level: 3, hp: 15, maxHp: 15 },
            { name: 'NIDORAN♀', level: 4, hp: 18, maxHp: 18 },
            { name: 'PIDGEY', level: 3, hp: 15, maxHp: 15 },
            { name: 'SPEAROW', level: 5, hp: 19, maxHp: 19 }
        ];
        
        this.init();
    }
    
    init() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx.imageSmoothingEnabled = false;
        
        // GameBoy button controls
        this.setupGameBoyControls();
        
        this.animate();
    }
    
    setupGameBoyControls() {
        // D-pad controls (listen for clicks on the actual GameBoy UI)
        window.addEventListener('message', (e) => {
            if (e.data.type === 'gameboy-input') {
                this.handleGameBoyInput(e.data.button);
            }
        });
        
        // Also set up direct click handlers if D-pad elements exist
        this.setupDPadClicks();
        this.setupButtonClicks();
    }
    
    setupDPadClicks() {
        // Create invisible clickable zones over D-pad
        const dpad = document.querySelector('.dpad');
        if (!dpad) return;
        
        dpad.addEventListener('click', (e) => {
            const rect = dpad.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const dx = x - centerX;
            const dy = y - centerY;
            
            // Determine direction based on click position
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal
                if (dx > 10) this.handleGameBoyInput('right');
                else if (dx < -10) this.handleGameBoyInput('left');
            } else {
                // Vertical
                if (dy > 10) this.handleGameBoyInput('down');
                else if (dy < -10) this.handleGameBoyInput('up');
            }
        });
    }
    
    setupButtonClicks() {
        // A and B buttons
        const buttons = document.querySelectorAll('.button');
        buttons.forEach((btn, i) => {
            btn.addEventListener('click', () => {
                if (i === 0) this.handleGameBoyInput('b'); // B button (left)
                else this.handleGameBoyInput('a'); // A button (right)
            });
        });
    }
    
    handleGameBoyInput(button) {
        if (this.showingParty) {
            // Party screen navigation
            switch(button) {
                case 'up':
                    this.partyCursor = Math.max(0, this.partyCursor - 1);
                    break;
                case 'down':
                    this.partyCursor = Math.min(this.party.length - 1, this.partyCursor + 1);
                    break;
                case 'a':
                    // Switch to selected Pokemon
                    const selected = this.party[this.partyCursor];
                    this.player.name = selected.name;
                    this.player.level = selected.level;
                    this.player.hp = selected.hp;
                    this.player.maxHp = selected.maxHp;
                    
                    this.showingParty = false;
                    this.battleText = `Go!\n${selected.name}!`;
                    break;
                case 'b':
                    // Cancel - go back to battle menu
                    this.showingParty = false;
                    this.battleText = 'What will\nCHARMANDER do?';
                    break;
            }
        } else {
            // Battle menu navigation
            switch(button) {
                case 'up':
                    this.menuCursor = Math.max(0, this.menuCursor - 2);
                    break;
                case 'down':
                    this.menuCursor = Math.min(2, this.menuCursor + 2);
                    break;
                case 'left':
                    if (this.menuCursor % 2 === 1) this.menuCursor--;
                    break;
                case 'right':
                    if (this.menuCursor % 2 === 0 && this.menuCursor < 3) this.menuCursor++;
                    break;
                case 'a':
                    this.selectMenuItem();
                    break;
                case 'b':
                    // B button - cancel/back
                    this.battleText = 'What will\nCHARMANDER do?';
                    break;
            }
        }
    }
    
    selectMenuItem() {
        const options = ['FIGHT', 'PKMN', 'ITEM', 'RUN'];
        const selected = options[this.menuCursor];
        
        if (selected === 'FIGHT') {
            this.triggerAttack();
        } else if (selected === 'PKMN') {
            this.showingParty = true;
            this.partyCursor = 0;
        } else {
            this.battleText = `Selected:\n${selected}`;
        }
    }
    
    triggerAttack() {
        if (!this.attacking) {
            this.attacking = true;
            this.attackFrame = 0;
            this.battleText = 'CHARMANDER used\nEMBER!';
        }
    }
    
    animate() {
        this.frame++;
        
        // Idle animations (gentle bobbing)
        this.enemy.bobOffset = Math.sin(this.frame * 0.05) * 1.5;
        this.player.bobOffset = Math.sin(this.frame * 0.05 + Math.PI) * 1.5;
        
        // Attack animation
        if (this.attacking) {
            this.attackFrame++;
            if (this.attackFrame > 30) {
                this.attacking = false;
                this.battleText = 'What will\nCHARMANDER do?';
            }
        }
        
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
    
    draw() {
        const ctx = this.ctx;
        
        ctx.fillStyle = this.colors.lightest;
        ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.showingParty) {
            // Show party screen
            this.drawPartyScreen();
        } else {
            // Show battle screen
            const enemyShake = this.attacking && this.attackFrame % 4 < 2 ? 2 : 0;
            
            this.drawSquirtle(enemyShake);
            this.drawCharmander();
            
            this.drawEnemyInfo();
            this.drawPlayerInfo();
            this.drawTextBox();
            this.drawBattleMenu();
            
            // Attack flash effect
            if (this.attacking && this.attackFrame < 10 && this.attackFrame % 2 === 0) {
                ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
                ctx.fillRect(0, 0, this.width, this.height);
            }
        }
    }
    
    drawSquirtle(shake = 0) {
        const x = this.enemy.x + shake;
        const y = this.enemy.baseY + Math.floor(this.enemy.bobOffset);
        
        const sprite = [
'0000000000000000000000000000000000000000',
'0000000000000000000000000000000000000000',
'0000000000000000000000000000000000000000',
'0000000000000000000000000000000000000000',
'0000000000000000000000000000000000000000',
'0000000000000000000000000000000000000000',
'0000000000000000000000000000000000000000',
'0000000000211111200000000000000000000000',
'0000000010033333310000000000000000000000',
'0000000100333333331000000000000000000000',
'0000001333333333333100000000000000000000',
'0000002333333333333200000000000000000000',
'0000023333333333333320000000000000000000',
'0000013103333310333310000000000000000000',
'0000013113333311332210000000000000000000',
'0000013212222321322310000000000000000000',
'0000023333333333333312000000000000000000',
'0000002311222223333100100000000000000000',
'0000001331222233331300020000000000000000',
'0000000133222333312300010000000000000000',
'0000000021111111222333120000000000000000',
'0000002131221222221221201000000000000000',
'0000213212221222322110323200000000000000',
'0002033230031300332110012100000000000000',
'0001002100120120031122021020000112000000',
'0000211212032002112221320010002333100000',
'0000000100031000033221320310013000310000',
'0000211100332000033221323310130212031000',
'0002003112120211233221321020201000102000',
'0001003311002000311221310101020030013100',
'0001033321031003332122123203310010023200',
'0000133221332033321112311120032001231000',
'0000012221232333212222121233333222310000',
'0000002110112112233222122300301211200000',
'0000000000000001333322112333010000000000',
'0000000000000000203322101300200000000000',
'0000000000000000100332300121000000000000',
'0000000000000000100331000000000000000000',
'0000000000000000021120000000000000000000',
'0000000000000000000000000000000000000000'
        ];
        
        this.drawPixelArt(sprite, x, y);
    }
    
    drawCharmander() {
        const x = this.player.x;
        const y = this.player.baseY + Math.floor(this.player.bobOffset);
        
        const sprite = [
'000000000000000000000000000000000000000000000000',
'000000000000000000000000000000000000000000000000',
'000000000000000000000000000000000000000000000000',
'000000000000000000000000000000000000000000000000',
'000000000000000000000000000000000000000000000000',
'000000000000000000000000000000000000000000000000',
'000000000000000000000000000000000000000000000000',
'000000000000000000000000000000000000000000000000',
'000000000000000000000000000000000000000000000000',
'000000000000000000000000000000000000000000000000',
'000000000000000000000000000000000000000000000000',
'000000000000000000000000000000000000000000000000',
'000000000000000000000000000000000000000000000000',
'000000000000000200000000000000000111111000000000',
'000000000000000220000000000000011200002110000000',
'000000000000002020000000000000120000002221000000',
'000000000002020200000000000001200000022222100000',
'000000002022022200000000000012220002222222210000',
'000000020212222000000000000012222222222222210000',
'000000202121222000000000000122222222222222121000',
'000000220212220000000000000122222222222222101000',
'000002222122200000000000000122222222222222101000',
'000002221222200000000000000122222222222222111000',
'000022222122000000000000000122222222222222111000',
'000022221212000000000000001222222222222222112100',
'000222222121000000000000001222222222222222212100',
'000202222212200000000000001222222222222222222210',
'000020222121200000000000001222222222222222222210',
'000202222222120000000000001222222222222222222210',
'002020222121210000000000001222222222222222111110',
'002202222122121000000000012222222222222211111100',
'002222222122212000000000012222222222222111111000',
'002222221112122000000000122222222222211111100000',
'000222221112210000000001222222222222111110000000',
'000222211112120000000001222222222222111000000000',
'000022211122200000000012022222222222211000000000',
'000002111120000000000120222222222220021000000000',
'000000111100000000001202022222222220002100000000',
'000000122100000000012020222222222222222210000000',
'000001222100000000010202222222222212222221000000',
'000001222100000000102022222222222212222222100000',
'000001222100000000120202222222222221222221110000',
'000012222210000001202022222222222220112211110000',
'000010222210000001020222222222222000111111101000',
'000010222210000010202222222222222000100111110000',
'000010222221000012222222222222220000100011010000',
'000010022222110012212222222222220000100000100000',
'000001002222221111122222222222200001000000000000'
        ];
        
        this.drawPixelArt(sprite, x, y);
    }
    
    drawPixelArt(sprite, startX, startY) {
        const ctx = this.ctx;
        
        for (let y = 0; y < sprite.length; y++) {
            for (let x = 0; x < sprite[y].length; x++) {
                const pixel = sprite[y][x];
                if (pixel === '0') continue;
                
                let color;
                if (pixel === '1') color = this.colors.darkest;
                else if (pixel === '2') color = this.colors.dark;
                else if (pixel === '3') color = this.colors.light;
                
                ctx.fillStyle = color;
                ctx.fillRect(startX + x, startY + y, 1, 1);
            }
        }
    }
    
    drawEnemyInfo() {
        const ctx = this.ctx;
        const box = { x: 8, y: 0, w: 80, h: 32 };
        
        this.drawRoundedBox(box.x, box.y, box.w, box.h);
        
        ctx.fillStyle = this.colors.darkest;
        ctx.font = 'bold 8px monospace';
        ctx.fillText(this.enemy.name, box.x + 4, box.y + 12);
        ctx.font = '8px monospace';
        ctx.fillText(':L' + this.enemy.level, box.x + 60, box.y + 12);
        ctx.font = 'bold 6px monospace';
        ctx.fillText('HP:', box.x + 4, box.y + 24);
        
        this.drawHPBar(box.x + 18, box.y + 18, 58, 4, this.enemy.hp, this.enemy.maxHp);
    }
    
    drawPlayerInfo() {
        const ctx = this.ctx;
        const box = { x: 72, y: 56, w: 84, h: 40 };
        
        this.drawRoundedBox(box.x, box.y, box.w, box.h);
        
        ctx.fillStyle = this.colors.darkest;
        ctx.font = 'bold 8px monospace';
        ctx.fillText(this.player.name, box.x + 4, box.y + 12);
        ctx.font = '8px monospace';
        ctx.fillText(':L' + this.player.level, box.x + 60, box.y + 12);
        ctx.font = 'bold 6px monospace';
        ctx.fillText('HP:', box.x + 4, box.y + 24);
        
        this.drawHPBar(box.x + 18, box.y + 18, 62, 4, this.player.hp, this.player.maxHp);
        
        ctx.font = 'bold 7px monospace';
        ctx.fillText(this.player.hp + '/' + this.player.maxHp, box.x + 48, box.y + 34);
    }
    
    drawTextBox() {
        const ctx = this.ctx;
        const box = { x: 0, y: 100, w: 70, h: 44 };
        
        this.drawRoundedBox(box.x, box.y, box.w, box.h);
        
        ctx.fillStyle = this.colors.darkest;
        ctx.font = 'bold 8px monospace';
        const lines = this.battleText.split('\n');
        lines.forEach((line, i) => {
            ctx.fillText(line, box.x + 6, box.y + 14 + (i * 12));
        });
    }
    
    drawBattleMenu() {
        const ctx = this.ctx;
        const box = { x: 72, y: 100, w: 88, h: 44 };
        
        this.drawRoundedBox(box.x, box.y, box.w, box.h);
        
        const options = ['FIGHT', 'PKMN', 'ITEM', 'RUN'];
        
        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = box.x + 10 + (col * 44);
            const y = box.y + 16 + (row * 18);
            
            // Cursor
            if (i === this.menuCursor) {
                ctx.fillStyle = this.colors.darkest;
                ctx.fillText('▶', x, y);
            }
            
            ctx.fillStyle = this.colors.darkest;
            ctx.font = 'bold 8px monospace';
            ctx.fillText(options[i], x + 10, y);
        }
    }
    
    drawMiniSprite(pokemonName, x, y) {
        const ctx = this.ctx;
        let sprite;
        
        // Gen 1 party menu sprites (16x16) - matching reference
        
        if (pokemonName === 'NIDORAN♂') {
            // Quadruped with pointed ears
            sprite = [
                '0000000110000000',
                '0000001221000000',
                '0000012222100000',
                '0000122222210000',
                '0001222111221000',
                '0012221001122100',
                '0122210000012210',
                '1222100000001221',
                '1221000000000221',
                '1210000000000121',
                '0210000000000210',
                '0210000000001200',
                '0121000000012100',
                '0012100000210000',
                '0001210012100000',
                '0000121121000000'
            ];
        } else if (pokemonName === 'NIDORAN♀') {
            // Quadruped with shorter, rounder ears
            sprite = [
                '0000001111000000',
                '0000012222100000',
                '0000122222210000',
                '0001222222221000',
                '0012222111222100',
                '0122221001122210',
                '1222210000012221',
                '1222100000001221',
                '1221000000000221',
                '1210000000000121',
                '0210000000000210',
                '0210000000001200',
                '0121000000012100',
                '0012100000210000',
                '0001210012100000',
                '0000121121000000'
            ];
        } else if (pokemonName === 'CHARMANDER') {
            // Bipedal upright with tail
            sprite = [
                '0000011111000000',
                '0000122222100000',
                '0001222112210000',
                '0012221001221000',
                '0122210000122100',
                '0122100000012210',
                '0121000000001210',
                '0121000000001210',
                '0121000000001210',
                '0121000000001210',
                '0012100000012100',
                '0012100000012100',
                '0001210000121000',
                '0000121001210000',
                '0000012112100000',
                '0000001221000000'
            ];
        } else if (pokemonName === 'RATTATA') {
            // Hunched quadruped with big round ears
            sprite = [
                '0001100000011000',
                '0012210000122100',
                '0012210000122100',
                '0001211111221000',
                '0000122222210000',
                '0001222112221000',
                '0012221001222100',
                '0122210000122210',
                '1222100000012221',
                '1221000000001221',
                '1210000000000121',
                '0210000000000210',
                '0121000000012100',
                '0012100000210000',
                '0001210012100000',
                '0000121121000000'
            ];
        } else if (pokemonName === 'PIDGEY') {
            // Round bird shape
            sprite = [
                '0000001111000000',
                '0000012222100000',
                '0000122222210000',
                '0001222222221000',
                '0012222222222100',
                '0122222221222210',
                '1222222110122221',
                '1222221000012221',
                '1222210000001221',
                '0122100000000210',
                '0012100000001200',
                '0001210000012100',
                '0000121000121000',
                '0000012101210000',
                '0000001212100000',
                '0000000111000000'
            ];
        } else if (pokemonName === 'SPEAROW') {
            // Angular/aggressive bird shape
            sprite = [
                '0000000011000000',
                '0000000122100000',
                '0000001222210000',
                '0000012222221000',
                '0000122222222100',
                '0001222222222210',
                '0012222211222221',
                '0122222100122221',
                '1222221000012221',
                '1222210000001221',
                '0122100000000210',
                '0012100000001200',
                '0001210000012100',
                '0000121000121000',
                '0000012101210000',
                '0000001212100000'
            ];
        } else {
            // Default generic quadruped
            sprite = [
                '0000001111000000',
                '0000012222100000',
                '0000122222210000',
                '0001222222221000',
                '0012222112222100',
                '0122221001222210',
                '1222210000122221',
                '1222100000012221',
                '1221000000001221',
                '1210000000000121',
                '0210000000000210',
                '0121000000012100',
                '0012100000210000',
                '0001210012100000',
                '0000121121000000',
                '0000000000000000'
            ];
        }
        
        // Render 16x16 icon
        for (let py = 0; py < sprite.length; py++) {
            for (let px = 0; px < sprite[py].length; px++) {
                const pixel = sprite[py][px];
                if (pixel === '0') continue;
                
                let color;
                if (pixel === '1') color = this.colors.darkest;
                else if (pixel === '2') color = this.colors.dark;
                
                ctx.fillStyle = color;
                ctx.fillRect(x + px, y + py, 1, 1);
            }
        }
    }
    
    drawPartyScreen() {
        const ctx = this.ctx;
        
        // Main party box
        const box = { x: 4, y: 4, w: 152, h: 112 };
        this.drawRoundedBox(box.x, box.y, box.w, box.h);
        
        // Draw each Pokemon entry
        for (let i = 0; i < this.party.length; i++) {
            const pokemon = this.party[i];
            const y = box.y + 6 + (i * 18);
            const x = box.x + 4;
            
            // Selection arrow
            if (i === this.partyCursor) {
                ctx.fillStyle = this.colors.darkest;
                ctx.font = 'bold 8px monospace';
                ctx.fillText('▶', x, y + 8);
            }
            
            // Mini sprite (16x16 party icon)
            this.drawMiniSprite(pokemon.name, x + 10, y);
            
            // Pokemon name
            ctx.fillStyle = this.colors.darkest;
            ctx.font = 'bold 8px monospace';
            ctx.fillText(pokemon.name, x + 26, y + 8);
            
            // Level
            ctx.font = '8px monospace';
            ctx.fillText(':L' + pokemon.level, x + 90, y + 8);
            
            // HP label and bar
            ctx.font = 'bold 6px monospace';
            ctx.fillText('HP:', x + 26, y + 18);
            
            // HP bar (smaller than battle HP bars)
            const hpBarX = x + 40;
            const hpBarY = y + 14;
            const hpBarWidth = 50;
            const hpBarHeight = 3;
            
            const barWidth = Math.floor((pokemon.hp / pokemon.maxHp) * hpBarWidth);
            
            // Bar background
            ctx.fillStyle = this.colors.dark;
            ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
            
            // Bar fill
            ctx.fillStyle = this.colors.darkest;
            ctx.fillRect(hpBarX, hpBarY, barWidth, hpBarHeight);
            
            // HP numbers
            ctx.font = 'bold 6px monospace';
            ctx.fillText(pokemon.hp + '/' + pokemon.maxHp, x + 96, y + 18);
        }
        
        // Bottom text box
        const textBox = { x: 4, y: 120, w: 152, h: 20 };
        this.drawRoundedBox(textBox.x, textBox.y, textBox.w, textBox.h);
        
        ctx.fillStyle = this.colors.darkest;
        ctx.font = 'bold 8px monospace';
        ctx.fillText('Choose a POKEMON.', textBox.x + 8, textBox.y + 13);
    }
    
    drawRoundedBox(x, y, w, h) {
        const ctx = this.ctx;
        const radius = 4;
        
        ctx.fillStyle = this.colors.lightest;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = this.colors.darkest;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    drawHPBar(x, y, width, height, hp, maxHp) {
        const ctx = this.ctx;
        const barWidth = Math.floor((hp / maxHp) * width);
        
        ctx.fillStyle = this.colors.dark;
        ctx.fillRect(x, y, width, height);
        
        ctx.fillStyle = this.colors.darkest;
        ctx.fillRect(x, y, barWidth, height);
        
        ctx.strokeStyle = this.colors.lightest;
        ctx.lineWidth = 1;
        for (let i = 6; i < width; i += 6) {
            ctx.beginPath();
            ctx.moveTo(x + i, y);
            ctx.lineTo(x + i, y + height);
            ctx.stroke();
        }
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('office-canvas');
        if (canvas) {
            console.log('✅ Pokemon Battle ANIMATED');
            window.pokemonBattle = new PokemonBattleAnimated(canvas);
        }
    });
}
