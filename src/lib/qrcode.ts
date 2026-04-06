import QRCode from 'qrcode';

export function generateDeepLink(
  idMerchant: string,
  idBranch: string,
  idOrder: string,
): string {
  const data = JSON.stringify({ idMerchant, idBranch, idOrder });
  const base64 = btoa(data);
  return `https://api.bonat.io/dynamicLink?data=${base64}`;
}

export async function generateQRCodeDataURL(
  data: string,
  size = 300,
): Promise<string> {
  return QRCode.toDataURL(data, {
    width: size,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

export function generateOrderId(): string {
  return crypto.randomUUID();
}
