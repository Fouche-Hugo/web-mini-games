const vm = Vue.createApp({
    data() {
        return {
            message: ""
        }
    },
    methods: {
        actualiseMessagePartieEnCours(nbCoups) {
            this.message = "Partie en cours, " + nbCoups + " coups joués.";
        },
        actualiseMessagePartieTerminee(nbCoups) {
            this.message = "Bravo, vous avez gagné en " + nbCoups + " coups.";
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
    emits: ['game-finished', 'game-not-finished'],
    data() {
        return {
            items: [],
            positionVide: 15,
            gameFinished: false,
            nbCoups: 0
        }
    },
    methods: {
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
            }
        },
        verifSolvability() {
            //Verifie si le jeu est solvable
            //On commence par chercher la parité de la position du vide
            let pariteVide = this.positionVide % 2;
            //On cherche ensuite la partié du nombre de permutations pour gagner
            let nbPermutations = 0;
            let copiesItems = [];
            this.items.forEach(item => {
                copiesItems.push({number: item.number, position: item.position});
            });
            for(let i = 0; i < copiesItems.length; i++) {
                nbPermutations += Math.abs(copiesItems[i].position - i);
                //On cherche l'item qui a la position i
                let item = copiesItems.find(item => item.position == i);
                if(item != undefined) {
                    item.position = copiesItems[i].position;
                }
                copiesItems[i].position = i;
            }
            let paritePermutations = nbPermutations % 2;
            //Si les deux parités sont identiques, le jeu est solvable
            if(pariteVide == paritePermutations) {
                return true;
            }
            return false;
        }
    },
    mounted() {
        this.createItems();
    },
    template: `
        <section class="game-container">
            <box-item v-for="item in items" :key="item.number" :number="item.number" :position="item.position" @box-item-double-click="moveItem" :locked="gameFinished"></box-item>
        </section>
    `
});

vm.mount('#game-container');