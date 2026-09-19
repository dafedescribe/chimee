const rawSupportNumber = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER?.trim() || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || '';
const rawOrderNumber = process.env.NEXT_PUBLIC_ORDER_WHATSAPP_NUMBER?.trim() || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || '';

const normalize = (n: string) => {
  let d = n.replace(/[^\d]/g, '');
  // Convert local Nigerian format 070... -> 23470...
  if (d.startsWith('0')) return '234' + d.slice(1);
  return d;
};

export const businessConfig = {
  supportWhatsApp: normalize(rawSupportNumber),
  orderWhatsApp: normalize(rawOrderNumber),
  whatsappChannelUrl: process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL?.trim() || '',
  instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() || '',
  twitterUrl: process.env.NEXT_PUBLIC_TWITTER_URL?.trim() || '',
};

export function buildWhatsAppUrl(message: string, type: 'support' | 'order' = 'order') {
  const number = type === 'support' ? businessConfig.supportWhatsApp : businessConfig.orderWhatsApp;
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
