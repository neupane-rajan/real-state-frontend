// Requests a resized, auto-format (WebP/AVIF), auto-quality version of a Cloudinary image.
// Non-Cloudinary URLs are returned unchanged.
export const optimizedImageUrl = (url: string, width: number) => {
  const marker = '/image/upload/'
  if (!url.includes('res.cloudinary.com') || !url.includes(marker)) {
    return url
  }

  return url.replace(marker, `${marker}f_auto,q_auto,c_limit,w_${width}/`)
}

// srcSet for responsive <img> elements backed by Cloudinary.
export const optimizedSrcSet = (url: string, widths: number[]) =>
  url.includes('res.cloudinary.com')
    ? widths.map((width) => `${optimizedImageUrl(url, width)} ${width}w`).join(', ')
    : undefined
