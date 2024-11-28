import { useRef, useEffect } from "react"

import { Filtration } from "../filtration/page"
import { Distillation } from "../distillation/page"
import { Fermentation } from "./Fermentation"
import { ReactorDesign } from "./Reactor"
import { createScene } from "./Scene"

export default function ProcessAnimation({ process, parameters, results, container }) {
    const sceneRef = useRef()
    const cameraRef = useRef()
    const rendererRef = useRef()
    const animationFrameRef = useRef()
  
    useEffect(() => {
      if (!container) return
  
      const sceneSetup = createScene(container)
  
      if (sceneSetup.error) {
        const errorMessage = document.createElement('div')
        errorMessage.textContent = "Your browser does not support WebGL, which is required for this simulation."
        errorMessage.style.color = "red"
        errorMessage.style.padding = "20px"
        container.appendChild(errorMessage)
        return () => {
          container.removeChild(errorMessage)
        }
      }
  
      const { scene, camera, renderer, controls, composer } = sceneSetup
      sceneRef.current = scene
      cameraRef.current = camera
      rendererRef.current = renderer
  
      let animate
      switch (process) {
        case 'filtration':
          animate = Filtration({ scene, parameters, results })
          break
        case 'distillation':
          animate = Distillation({ scene, parameters, results })
          break
        case 'fermentation':
          animate = Fermentation({ scene, parameters, results })
          break
        case 'reactorDesign':
          animate = ReactorDesign({ scene, parameters, results })
          break
        default:
          animate = () => {}
      }
  
      function render() {
        animationFrameRef.current = requestAnimationFrame(render)
        animate()
        controls.update()
      }
  
      render()
  
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (rendererRef.current) {
          rendererRef.current.dispose()
          container.removeChild(rendererRef.current.domElement)
        }
      }
    }, [process, parameters, results, container])
  
    return null
}