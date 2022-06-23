const vm = Vue.createApp({
    data() {
        return {
            message: "",
            timer: ""
        }
    },
    methods: {
        actualiseMessagePartieEnCours(nbCoups) {
            this.message = "Partie en cours, " + nbCoups + " coups joués.";
        },
        actualiseMessagePartieTerminee(nbCoups) {
            this.message = "Bravo, vous avez gagné en " + nbCoups + " coups.";
        },
        actualiseMessagePartieReset() {
            this.message = "";
        },
        reroll() {
            this.$refs.game.createItems();
        },
        actualiseTimer(timer) {
            this.timer = timer;
        },
        resolve() {
            console.log("Solving...");
            this.$refs.game.resolve();
        }
    }
})

vm.component('box-item', {
    props: ['number', 'position', 'locked'],
    emits: ['box-item-double-click'],
    methods: {
        boxItemDoubleClick() {
            if(!this.locked) {
                this.$emit('box-item-double-click', this.number, this.position);
            }
        },
        boxItemHover() {
            //Change la couleur de la bordure de l'item
        }
    },
    mounted() {
        //Place l'item à la bonne position
    },
    template: `
        <div class="box-item" :class="'position' + (parseInt(this.position) + 1).toString()" @dblclick="boxItemDoubleClick">
            <span>{{number}}</span>
        </div>
    `
});

vm.component('box', {
    props: ['amount'],
    emits: ['game-finished', 'game-not-finished', 'game-reset', 'timer-update'],
    data() {
        return {
            items: [],
            positionVide: 15,
            gameFinished: false,
            nbCoups: 0,
            timer: 0,
            interval: null
        }
    },
    methods: {
        keyEvnt(direction) {
            if(!this.gameFinished) {
                let positionXvide = this.positionVide % 4;
                let positionYvide = Math.floor(this.positionVide / 4);

                let pos = 0;
                let number = 0;
                if(direction == "right" && positionXvide > 0) {
                    this.items.forEach(item => {
                        if(item.position == this.positionVide-1) {
                            pos = item.position;
                            number = item.number;
                        }
                    });

                    this.moveItem(number, pos);
                }
                else if(direction == "left" && positionXvide < 3) {
                    this.items.forEach(item => {
                        if(item.position == this.positionVide+1) {
                            pos = item.position;
                            number = item.number;
                        }
                    });

                    this.moveItem(number, pos);
                } else if(direction == "down" && positionYvide > 0) {
                    this.items.forEach(item => {
                        if(item.position == this.positionVide-4) {
                            pos = item.position;
                            number = item.number;
                        }
                    });

                    this.moveItem(number, pos);
                } else if(direction == "up" && positionYvide < 3) {
                    this.items.forEach(item => {
                        if(item.position == this.positionVide+4) {
                            pos = item.position;
                            number = item.number;
                        }
                    });

                    this.moveItem(number, pos);
                }
            }
        },
        moveItem(number, position) {
            //Move l'item dans la bonne position si possible
            posX = position % 4;
            posY = Math.floor(position / 4);

            posVideX = this.positionVide % 4;
            posVideY = Math.floor(this.positionVide / 4);

            if(posX == posVideX && (posY == posVideY + 1 || posY == posVideY - 1)) {
                this.items[number-1].position = this.positionVide;
                this.positionVide = position;
                this.nbCoups++;
            } else if(posY == posVideY && (posX == posVideX + 1 || posX == posVideX - 1)) {
                this.items[number-1].position = this.positionVide;
                this.positionVide = position;
                this.nbCoups++;
            }
            
            if(this.verifItems()) {
                this.gameFinished = true;
                clearInterval(this.interval);
                this.$emit('game-finished', this.nbCoups);
            } else {
                this.$emit('game-not-finished', this.nbCoups);
            }
        },
        verifItems() {
            //Verifie si tous les items sont bien placés
            for(let i = 0; i < this.amount; i++) {
                if(this.items[i].position != i) {
                    return false;
                }
            }
            return true;
        },
        createItems() {
            //Crée les items
            let positionsUtilises = [];
            this.items = [];
            this.$emit('game-reset');
            this.timer = 0;
            this.$emit('timer-update', this.timer);
            this.gameFinished = false;
            for(let i = 1;i <= parseInt(this.amount);i++) {
                let position = Math.floor(Math.random() * (parseInt(this.amount)+1));
                while(positionsUtilises.includes(position)) {
                    position = Math.floor(Math.random() * (parseInt(this.amount)+1));
                }
                this.items.push({number: i, position: position});
                positionsUtilises.push(position);
            }
            for(let i = 0; i <= parseInt(this.amount); i++) {
                if(!positionsUtilises.includes(i)) {
                    this.positionVide = i;
                    break;
                }
            }
            if(!this.verifSolvability()) {
                this.createItems();
            } else {
                if(this.interval != null) {
                    clearInterval(this.interval);
                }
                this.interval = setInterval(this.updateTimer, 1000);
            }
        },
        verifSolvability() {
            //Verifie si le jeu est solvable
            //On commence par chercher la parité de la position du vide
            let posVideX = this.positionVide % 4;
            let posVideY = Math.floor(this.positionVide / 4);
            let pariteVide = posVideX % 2 + posVideY % 2;
            //On cherche ensuite la partié du nombre de permutations pour gagner
            let nbPermutations = 0;
            let copiesItems = [];
            this.items.forEach(item => {
                copiesItems.push({number: item.number, position: item.position});
            });
            let copiesFinales = copiesItems.slice(0, this.positionVide)
            copiesFinales.push(null);
            copiesFinales = copiesFinales.concat(copiesItems.slice(this.positionVide));
            //On compte les permutations
            for(let i = 0;i < copiesItems.length-1;i++) {
                for(let j = i+1;j < copiesItems.length;j++) {
                    if(copiesFinales[j] != null && copiesFinales[i] != null && copiesFinales[i].number > copiesFinales[j].number) {
                        nbPermutations++;
                    }
                }
            }
            let paritePermutations = nbPermutations % 2;
            //Si les deux parités sont identiques, le jeu est solvable
            if(pariteVide == paritePermutations) {
                return true;
            }
            return false;
        },
        updateTimer() {
            this.timer++;
            this.$emit('timer-update', this.timer);
        }
    },
    mounted() {
        this.createItems();
        window.addEventListener('keydown', (e) => {
            if(e.key == "ArrowRight") {
                this.keyEvnt('right');
            } else if(e.key == "ArrowLeft") {
                this.keyEvnt('left');
            } else if(e.key == "ArrowUp") {
                this.keyEvnt('up');
            } else if(e.key == "ArrowDown") {
                this.keyEvnt('down');
            }
        });
    },
    template: `
        <section class="game-container" :class="{win: gameFinished}">
            <box-item v-for="item in items" :key="item.number" :number="item.number" :position="item.position" @box-item-double-click="moveItem" :locked="gameFinished"></box-item>
        </section>
    `
});

vm.mount('body');