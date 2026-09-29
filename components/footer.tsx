import Link from 'next/link'
import { Mail, Phone, MapPin, Globe, Star, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VA</span>
              </div>
              <div>
                <div className="text-lg font-bold text-primary">Vertex</div>
                <div className="text-xs text-muted-foreground">Vertex Assessment Center</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Vertex Testing Services Limited
            </p>
            <div className="flex gap-3">
              <SocialLink href="#" icon={Globe} />
              <SocialLink href="#" icon={Star} />
              <SocialLink href="#" icon={Heart} />
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Services</h3>
            <ul className="space-y-2">
              <FooterLink href="/pte-academic">PTE Academic Registration</FooterLink>
              <FooterLink href="/pte-core">PTE Core Registration</FooterLink>
              <FooterLink href="/preparation">PTE Preparation</FooterLink>
              <FooterLink href="/mock-tests">PTE Mock Tests</FooterLink>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
              <FooterLink href="#faq">FAQs</FooterLink>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">
                  Vertex Testing Services Limited, Proxy Building, Prince Dele Alao Close, Olokuta Junction Idi-aba, Abeokuta, 111101, Ogun State
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <a
                  href="tel:07026738900"
                  className="text-sm text-muted-foreground hover:text-primary transition"
                >
                  07026738900
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <a
                  href="mailto:info@vertextestingservices.com"
                  className="text-sm text-muted-foreground hover:text-primary transition"
                >
                  info@vertextestingservices.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Vertex Testing Services Limited. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary transition"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary transition"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({
  href,
  children,
}: {
  href: string
  children: string
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted-foreground hover:text-primary transition"
      >
        {children}
      </Link>
    </li>
  )
}

function SocialLink({
  href,
  icon: Icon,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <a
      href={href}
      className="w-10 h-10 rounded-full bg-secondary hover:bg-primary/10 flex items-center justify-center transition"
      aria-label="Social link"
    >
      <Icon className="w-5 h-5 text-primary" />
    </a>
  )
}
