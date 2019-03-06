import '@/styles/index.scss'
import { Elm } from '@/Main.elm'

Elm.Main.init({ node: document.getElementById('😎'), flags: (window as ClientWindow).CAN_USE_WEBP })
