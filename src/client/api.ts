export const API = {
  file: (p: string) => `/api/file?path=${encodeURIComponent(p)}`,
  raw: (p: string) => `/api/raw?path=${encodeURIComponent(p)}`,
  folder: (p: string) => `/api/folder?path=${encodeURIComponent(p)}`,
  rename: (oldP: string, newP: string) =>
    `/api/rename?path=${encodeURIComponent(oldP)}&newPath=${encodeURIComponent(newP)}`,
};

export async function throwIfNotOk(res: Response): Promise<void> {
  if (res.ok) return;
  const body = await res.text();
  let msg: string;
  try {
    msg = JSON.parse(body).error;
  } catch {
    msg = body || res.statusText;
  }
  throw new Error(msg);
}
