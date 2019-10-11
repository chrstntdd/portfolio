import path from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { brotliCompressSync } from 'zlib'

import fs from 'fs-extra'
import chalk from 'chalk'
import webpack from 'webpack'
import workbox from 'workbox-build'

import { walkSync } from '@chrstntdd/node'

import config from '../webpack.config'
import { build, src } from './paths'

const USE_SERVICE_WORKER = process.env.USE_SW

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

function removeInlinedFiles() {
  for (const file of walkSync(build, { filter: fileName => /\.(js|css)$/.test(fileName) })) {
    // delete the output js file since it is already inlined into the html
    if (fs.existsSync(file.name)) {
      fs.unlinkSync(file.name)
    }
  }
}

function compressStaticAssets() {
  for (const { name } of walkSync(build, { filter: fileName => /\.(js|html)$/.test(fileName) })) {
    console.log(name)

    // delete the output js file since it is already inlined into the html
    const content = readFileSync(name)
    const compressedContent = brotliCompressSync(content)
    writeFileSync(`${name}.br`, compressedContent, 'UTF-8')
  }
}

;(async () => {
  try {
    // Dont measure file sizes on netlify builds
    if (process.env.NETLIFY) {
      await run()

      await copyNetlifyConfig()

      removeInlinedFiles()

      await generateServiceWorker()

      compressStaticAssets()
    } else {
      fs.removeSync(build)
      console.log(
        `✨ Cleaned out all them there old files from ${chalk.dim(
          './' + path.relative(process.cwd(), build) + '/'
        )} for ya ✨\n`
      )

      await run()

      removeInlinedFiles()

      USE_SERVICE_WORKER && (await generateServiceWorker())
    }
  } catch (error) {
    console.log(error)
  }
})()
