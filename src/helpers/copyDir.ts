import { promises as fs } from "fs";
import path from "path";

export default async function copyDir(src: string, dest: string) {
	await fs.mkdir(dest, { recursive: true });
	let entries = await fs.readdir(src, { withFileTypes: true });

	for (let entry of entries) {
		let srcPath = path.join(src, entry.name);
		let destPath = path.join(dest, entry.name);

		entry.isDirectory()
			? await copyDir(srcPath, destPath)
			: await fs.copyFile(srcPath, destPath);
	}
}
