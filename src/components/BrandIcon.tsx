import { BRAND_PATHS } from '../lib/brandIcons'

interface Props {
  name: string
  size?: number
  className?: string
}

export function BrandIcon({ name, size = 18, className }: Props) {
  const path = BRAND_PATHS[name]
  if (!path) return null
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} />
    </svg>
  )
}

export function hasBrand(name: string): boolean {
  return Boolean(BRAND_PATHS[name])
}
