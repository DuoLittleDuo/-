/**
 * 垚垚 3D 形象：基于智能体自带模型（yaoyao.glb）与程序化动作。
 * 不依赖 npm 的 three，直接加载 public/vendor/yaoyao 下的全局构建，
 * 场景按实例创建，销毁时释放 WebGL 资源。
 */
let vendorPromise = null

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-yaoyao="${src}"]`)
    if (existing) {
      if (existing.dataset.loaded === 'true') resolve()
      else existing.addEventListener('load', () => resolve(), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.dataset.yaoyao = src
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true'
      resolve()
    })
    script.addEventListener('error', () => reject(new Error(`加载失败：${src}`)))
    document.head.appendChild(script)
  })
}

export function loadYaoyaoVendor() {
  if (window.THREE?.GLTFLoader) return Promise.resolve(window.THREE)
  if (!vendorPromise) {
    vendorPromise = loadScript('/vendor/yaoyao/three.min.js')
      .then(() => loadScript('/vendor/yaoyao/GLTFLoader.js'))
      .then(() => loadScript('/vendor/yaoyao/OrbitControls.js').catch(() => {}))
      .then(() => window.THREE)
  }
  return vendorPromise
}

/* ---------- 情绪 → 灯光 / 表情 ---------- */

const MOTION_LIGHT = {
  happy: { color: 0xffc46b, intensity: 0.9 },
  sad: { color: 0x6688ff, intensity: 0.7 },
  angry: { color: 0xff3344, intensity: 1.2 },
  surprised: { color: 0xffffff, intensity: 0.9 },
  shy: { color: 0xff8fc4, intensity: 0.8 },
  thinking: { color: 0x9fb4ff, intensity: 0.6 },
}

const MOTION_FX = {
  happy: { icons: ['✦', '♥', '✦'], count: 3 },
  sad: { icons: ['·', '·'], count: 2 },
  angry: { icons: ['!', '!'], count: 2 },
  surprised: { icons: ['!', '?'], count: 2 },
  shy: { icons: ['♥', '✿'], count: 3 },
  thinking: { icons: ['…'], count: 1 },
}

const easeInOut = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2)

function hold(p, riseEnd, fallStart) {
  if (p < riseEnd) return easeInOut(p / riseEnd)
  if (p > fallStart) return 1 - easeInOut((p - fallStart) / (1 - fallStart))
  return 1
}

const MOTIONS = {
  jump: {
    duration: 1,
    update(p, root) {
      if (p < 0.16) {
        const q = p / 0.16
        root.position.y = -0.16 * q
        root.scale.set(1 + 0.1 * q, 1 - 0.14 * q, 1 + 0.1 * q)
      } else if (p < 0.62) {
        const u = (p - 0.16) / 0.46
        const h = Math.sin(u * Math.PI)
        root.position.y = h * 0.5
        root.scale.set(1 - 0.04 * h, 1 + 0.06 * h, 1 - 0.04 * h)
        root.rotation.z = Math.sin(u * Math.PI * 2) * 0.03
      } else if (p < 0.82) {
        const u = (p - 0.62) / 0.2
        const h = Math.sin(u * Math.PI)
        root.position.y = -0.1 * h
        root.scale.set(1 + 0.08 * h, 1 - 0.12 * h, 1 + 0.08 * h)
      }
    },
  },
  spin: {
    duration: 0.9,
    update(p, root) {
      root.rotation.y = Math.PI * 2 * easeInOut(p)
      root.position.y = Math.sin(p * Math.PI) * 0.08
    },
  },
  nod: {
    duration: 0.7,
    update(p, root) {
      const k = Math.sin(p * Math.PI * 3) * Math.exp(-2.5 * p)
      root.rotation.x = k * 0.14
    },
  },
  shake: {
    duration: 0.8,
    update(p, root) {
      const k = Math.sin(p * Math.PI * 6) * Math.exp(-2.2 * p)
      root.rotation.y = k * 0.22
      root.position.x = k * 0.04
    },
  },
  happy: {
    duration: 1.3,
    light: MOTION_LIGHT.happy,
    update(p, root) {
      const h = Math.abs(Math.sin(p * Math.PI * 2))
      root.position.y = h * 0.2
      root.rotation.z = Math.sin(p * Math.PI * 2) * 0.05
      root.scale.set(1 - 0.03 * h, 1 + 0.05 * h, 1 - 0.03 * h)
    },
  },
  angry: {
    duration: 1.4,
    light: MOTION_LIGHT.angry,
    update(p, root) {
      const k = Math.sin(p * 40) * (1 - p)
      root.position.x = k * 0.02
      root.rotation.z = k * 0.02
      root.position.y = Math.sin(p * Math.PI) * 0.03
      const s = 1 + 0.02 * Math.sin(p * Math.PI)
      root.scale.set(s, s, s)
    },
  },
  sad: {
    duration: 1.8,
    light: MOTION_LIGHT.sad,
    update(p, root) {
      const h = hold(p, 0.25, 0.7)
      root.rotation.x = 0.25 * h
      root.position.y = -0.09 * h
      root.rotation.z = Math.sin(p * Math.PI * 2) * 0.02
    },
  },
  surprised: {
    duration: 0.7,
    light: MOTION_LIGHT.surprised,
    update(p, root) {
      const h = Math.sin(Math.PI * Math.min(p / 0.6, 1))
      const s = 1 + 0.18 * h
      root.scale.set(s, s, s)
      root.position.y = 0.12 * h
      root.rotation.x = -0.04 * h
    },
  },
  shy: {
    duration: 1.6,
    light: MOTION_LIGHT.shy,
    update(p, root) {
      const h = hold(p, 0.2, 0.8)
      root.rotation.z = 0.12 * h + Math.sin(p * Math.PI * 4) * 0.015 * (1 - p)
      root.rotation.y = Math.sin(p * Math.PI * 2) * 0.06 * h
      root.position.y = -0.02 * h
    },
  },
  thinking: {
    duration: 20,
    light: MOTION_LIGHT.thinking,
    update(p, root) {
      const h = hold(p, 0.2, 0.85)
      root.rotation.z = 0.09 * h
      root.rotation.x = 0.05 * h
      root.position.y = Math.sin(p * Math.PI * 3) * 0.01 * h
    },
  },
  look: {
    duration: 2,
    update(p, root) {
      const h = Math.sin(p * Math.PI)
      root.rotation.y = Math.sin(p * Math.PI * 2) * 0.18 * h
      root.rotation.z = Math.sin(p * Math.PI * 4) * 0.02
    },
  },
  hopSmall: {
    duration: 0.7,
    update(p, root) {
      const h = Math.sin(p * Math.PI)
      root.position.y = h * 0.12
      root.scale.set(1 - 0.02 * h, 1 + 0.03 * h, 1 - 0.02 * h)
    },
  },
  stretch: {
    duration: 1.4,
    update(p, root) {
      const h = Math.sin(p * Math.PI)
      root.position.y = 0.06 * h
      root.scale.set(1 - 0.03 * h, 1 + 0.05 * h, 1 - 0.03 * h)
      root.rotation.x = -0.03 * h
    },
  },
  sway: {
    duration: 2.6,
    update(p, root) {
      const h = Math.sin(p * Math.PI)
      root.rotation.z = Math.sin(p * Math.PI * 2) * 0.06 * h
      root.position.x = Math.sin(p * Math.PI * 2) * 0.05 * h
    },
  },
}

const AMBIENT_POOL = [
  'look', 'look', 'look',
  'nod', 'nod',
  'shake',
  'hopSmall', 'hopSmall',
  'stretch',
  'sway', 'sway',
  'spin',
]

const IDLE_LINES = ['嘿嘿～', '要不要聊聊？', '我是垚垚呀']

export async function createYaoyao(container, options = {}) {
  const {
    modelUrl = '/vendor/yaoyao/yaoyao.glb',
    controls = false,
    interactive = true,
    zoom = 1,
    onTap,
    onReady,
    onProgress,
  } = options

  const THREE = await loadYaoyaoVendor()
  if (!container) throw new Error('缺少容器')

  let disposed = false
  const clock = new THREE.Clock()

  const scene = new THREE.Scene()
  const width = container.clientWidth || 200
  const height = container.clientHeight || 260

  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100)
  camera.position.set(0, 0.25, 6.5 * zoom)

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  if ('outputEncoding' in renderer && THREE.sRGBEncoding) {
    renderer.outputEncoding = THREE.sRGBEncoding
  }
  renderer.domElement.style.display = 'block'
  container.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xffffff, 1.1))

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.7)
  keyLight.position.set(2.5, 3.5, 4)
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0xaabbff, 0.7)
  fillLight.position.set(-3, 1.5, 2)
  scene.add(fillLight)

  const rimLight = new THREE.DirectionalLight(0xffddaa, 0.9)
  rimLight.position.set(0, 2, -4)
  scene.add(rimLight)

  const moodLight = new THREE.PointLight(0xffffff, 0)
  moodLight.position.set(0, 0.6, 3.2)
  scene.add(moodLight)
  const lightTarget = { color: new THREE.Color(0xffffff), intensity: 0 }

  const avatarRoot = new THREE.Group()
  scene.add(avatarRoot)

  const fxLayer = document.createElement('div')
  fxLayer.className = 'yaoyao-fx-layer'
  container.appendChild(fxLayer)

  let model3d = null
  let ready = false
  let motion = null
  let nextAmbientAt = Infinity
  let rafId = null
  let orbit = null

  const setMoodLight = (def) => {
    const cfg = def || { color: 0xffffff, intensity: 0 }
    lightTarget.color.setHex(cfg.color)
    lightTarget.intensity = cfg.intensity
  }

  const clearFx = () => {
    fxLayer.innerHTML = ''
  }

  const spawnFx = (name) => {
    const cfg = MOTION_FX[name]
    if (!cfg) return
    clearFx()
    for (let i = 0; i < cfg.count; i += 1) {
      const el = document.createElement('span')
      el.className = 'yaoyao-fx'
      el.textContent = cfg.icons[i % cfg.icons.length]
      el.style.left = `${50 + (Math.random() * 30 - 15)}%`
      el.style.top = `${18 + Math.random() * 12}%`
      el.style.fontSize = `${18 + Math.random() * 10}px`
      el.style.animationDelay = `${i * 0.12}s`
      fxLayer.appendChild(el)
      el.addEventListener('animationend', () => el.remove())
    }
  }

  const play = (name) => {
    if (!ready || !clock) return
    if (!name || name === 'neutral' || name === 'idle') {
      motion = null
      setMoodLight(null)
      clearFx()
      nextAmbientAt = clock.getElapsedTime() + 1.5 + Math.random() * 2.5
      return
    }
    const def = MOTIONS[name]
    if (!def) return
    motion = { def, start: clock.getElapsedTime() }
    setMoodLight(def.light || null)
    spawnFx(name)
  }

  let lastTime = 0
  const animate = () => {
    if (disposed) return
    rafId = requestAnimationFrame(animate)

    const time = clock.getElapsedTime()
    const dt = Math.min(time - lastTime, 0.1)
    lastTime = time

    avatarRoot.position.set(0, 0, 0)
    avatarRoot.rotation.set(0, 0, 0)
    avatarRoot.scale.set(1, 1, 1)

    const breath = 1 + Math.sin(time * 1.6) * 0.006
    avatarRoot.position.y += Math.sin(time * 1.6) * 0.012
    avatarRoot.position.x += Math.sin(time * 0.55) * 0.012
    avatarRoot.rotation.z += Math.sin(time * 0.9) * 0.012
    avatarRoot.scale.set(breath, 1 / breath, breath)

    if (motion) {
      const p = (time - motion.start) / motion.def.duration
      if (p >= 1) {
        motion = null
        setMoodLight(null)
        nextAmbientAt = time + 2.5 + Math.random() * 3.5
      } else {
        motion.def.update(p, avatarRoot, time)
      }
    } else if (ready && time > nextAmbientAt) {
      play(AMBIENT_POOL[Math.floor(Math.random() * AMBIENT_POOL.length)])
      nextAmbientAt = time + 3.5 + Math.random() * 4.5
    }

    moodLight.color.lerp(lightTarget.color, 0.12)
    moodLight.intensity += (lightTarget.intensity - moodLight.intensity) * 0.12

    orbit?.update()
    renderer.render(scene, camera)
  }

  const loader = new THREE.GLTFLoader()
  const modelPromise = new Promise((resolve, reject) => {
    loader.load(
      modelUrl,
      (gltf) => {
        if (disposed) return
        model3d = gltf.scene

        const box = new THREE.Box3().setFromObject(model3d)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z) || 1

        model3d.position.x -= center.x
        model3d.position.y -= center.y
        model3d.position.z -= center.z
        model3d.scale.setScalar(2 / maxDim)

        avatarRoot.add(model3d)
        model3d.traverse((node) => {
          if (node.isMesh) {
            node.frustumCulled = false
            if (node.material) node.material.side = THREE.FrontSide
          }
        })

        ready = true
        nextAmbientAt = clock.getElapsedTime() + 2 + Math.random() * 2
        window.setTimeout(() => play('hopSmall'), 500)
        onReady?.()
        resolve(gltf)
      },
      (event) => {
        if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100))
      },
      (error) => reject(error),
    )
  })

  if (controls && THREE.OrbitControls) {
    orbit = new THREE.OrbitControls(camera, renderer.domElement)
    orbit.enablePan = false
    orbit.enableZoom = false
    orbit.minDistance = 4.5 * zoom
    orbit.maxDistance = 9 * zoom
    orbit.minPolarAngle = Math.PI * 0.22
    orbit.maxPolarAngle = Math.PI * 0.7
    orbit.target.set(0, 0.1, 0)
  }

  if (interactive) {
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    renderer.domElement.addEventListener('click', (event) => {
      if (!model3d) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      if (raycaster.intersectObject(model3d, true).length > 0) {
        play(['jump', 'spin', 'nod', 'shake', 'happy'][Math.floor(Math.random() * 5)])
        onTap?.()
      }
    })
  }

  const resize = () => {
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
  observer?.observe(container)

  animate()

  return {
    play,
    resize,
    ready: modelPromise,
    greet: () => play('hopSmall'),
    dispose() {
      disposed = true
      if (rafId) cancelAnimationFrame(rafId)
      observer?.disconnect()
      orbit?.dispose?.()
      clearFx()
      scene.traverse((node) => {
        if (node.isMesh) {
          node.geometry?.dispose?.()
          const materials = Array.isArray(node.material) ? node.material : [node.material]
          materials.forEach((mat) => {
            if (!mat) return
            Object.values(mat).forEach((value) => {
              if (value?.isTexture) value.dispose()
            })
            mat.dispose?.()
          })
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}

export const YAOYAO_LINES = IDLE_LINES
