import {
  BookOpen,
  Briefcase,
  Calendar,
  Camera,
  Code2,
  Gamepad2,
  Globe,
  Heart,
  Link2,
  Mail,
  Music2,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { BrandIcon, hasBrand } from './BrandIcon'

const LUCIDE_MAP: Record<string, LucideIcon> = {
  globe: Globe,
  mail: Mail,
  sparkles: Sparkles,
  link: Link2,
  briefcase: Briefcase,
  code: Code2,
  music: Music2,
  book: BookOpen,
  calendar: Calendar,
  heart: Heart,
  camera: Camera,
  gamepad: Gamepad2,
}

interface Props {
  name: string
  size?: number
  strokeWidth?: number
}

export function ItemIcon({ name, size = 18, strokeWidth = 1.8 }: Props) {
  if (hasBrand(name)) return <BrandIcon name={name} size={size} />
  const Icon = LUCIDE_MAP[name] ?? Link2
  return <Icon size={size} strokeWidth={strokeWidth} />
}
