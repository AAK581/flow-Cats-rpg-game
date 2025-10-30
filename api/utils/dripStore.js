import { promises as fs } from 'fs';
import path from 'path';

const FILE = path.resolve('./data/drips.json');

async function load() {
  try {
    const data = await fs.readFile(FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

async function save(map) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(map, null, 2));
}

export async function shouldDrip(userAddress) {
  const map = await load();
  const key = userAddress.toLowerCase();
  const last = map[key];

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  if (!last || now - last > oneDay) {
    map[key] = now;
    await save(map);
    return true;
  }
  return false;
}