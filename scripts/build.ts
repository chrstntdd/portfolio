import fs from 'fs-extra'
import path from 'path'
import webpack from 'webpack'
import workbox from 'workbox-build'

import config from '../webpack.config'
import { build, src } from './paths'

const USE_SERVICE_WORKER = process.env.USE_SW

/**
 * @description
 * Synchronously walk a directory with a generator for reduced space
 * complexity `O(n) -> O(1)`
 */
function* walkSync(dir: string) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const pathToFile = path.join(dir, file)
    const isDirectory = fs.statSync(pathToFile).isDirectory()
    if (isDirectory) {
      yield* walkSync(pathToFile)
    } else {
      yield pathToFile
    }
  }
}

// Production  build scripts
function run() {
  const compiler = webpack(config)

  return new Promise((res, rej) => {
    compiler.run((err, stats) => {
      if (err) return rej(err)

      return res()
    })
  })
}

async function copyNetlifyConfig() {
  try {
    fs.copy(path.join(__dirname, '../netlify.toml'), `${build}/netlify.toml`)
  } catch (error) {
    console.error('Netlify config not found')
  }
}

async function generateServiceWorker() {
  try {
    const stats = await workbox.injectManifest({
      globDirectory: build,
      globPatterns: ['**/*.{html,js,css,png,svg,jpg,jpeg,gif,ico}'],
      globIgnores: ['**/sw.js'],
      swSrc: path.resolve(src, 'sw.js'),
      swDest: path.resolve(build, 'sw.js')
    })

    console.info(
      ` ⚙️ Service worker generated 🛠 \n ${
        stats.count
      } files will be precached, totaling ${stats.size / 1000000.0} MB.`
    )
  } catch (error) {
    console.error('  😒 There was an error generating the service worker 😒', error)
  }
}

async function removeInlinedFiles() {
  for (const file of walkSync(build)) {
    // delete the output js file since it is already inlined into the html
    if (/\.(js|css)$/.test(file)) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
      }
    }
  }
}

;(async () => {
  try {
    // Dont measure file sizes on netlify builds
    if (process.env.NETLIFY) {
      await run()

      await copyNetlifyConfig()

      await removeInlinedFiles()

      await generateServiceWorker()
    } else {
      await run()

      await removeInlinedFiles()

      USE_SERVICE_WORKER && (await generateServiceWorker())
    }
  } catch (error) {
    console.log(error)
  }
})()
