import esbuild from "esbuild"
import fs from "node:fs/promises"

// God I hate raw JavaScript

/** @returns{Record<String, String>} */
function getFiles() {
	const sources = ["main"]
	const statics = ["manifest.json"]

	const entries = {}
	sources.forEach(file => entries[file] = `src/${file}.ts`)
	statics.forEach(file => {
		// File stem (no extension)
		const stem = file.substring(0, file.search('\\.'))
		entries[stem] = `static/${file}`
	})

	return entries
}

async function build() {
	await esbuild.build({
		bundle: true,
		format: "iife",
		outdir: "build",
		entryPoints: getFiles(),
		loader: {
			".json": "copy",
		},
	})
}

build()
