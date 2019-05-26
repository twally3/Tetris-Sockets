import ConnectionManager from './ConnectionManager.js'
import TetrisManager from './TetrisManager.js'

const tetrisManager = new TetrisManager(document)
const localTetris = tetrisManager.createPlayer()
localTetris.element.classList.add('local')
localTetris.run()

const connectionManager = new ConnectionManager(tetrisManager)
connectionManager.connect(window.location.origin.replace(/^http/, 'ws'))

const audioManager = document.getElementById('music')

const keyListener = event => {
    const player = localTetris.player

    if (event.type === 'keydown') {
        if (event.code === 'KeyA') {
            player.move(-1)        
        } else if (event.code === 'KeyD') {
            player.move(1)
        } else if (event.code === 'KeyE') {
            player.rotate(-1)
        } else if (event.code === 'KeyQ') {
            player.rotate(1)
        } else if (event.code === 'KeyM') {
					if (audioManager.paused) audioManager.play();
					else audioManager.pause();
				}
    }
    
    if (event.code === 'KeyS') {
        if (event.type === 'keydown') {
            if (player.dropInterval !== player.DROP_FAST) {
                player.drop()
                player.dropInterval = player.DROP_FAST
            }
        } else {
            player.dropInterval = player.DROP_SLOW
        }
		}	
}


document.addEventListener('keydown', keyListener)
document.addEventListener('keyup', keyListener)