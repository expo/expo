'use client'

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CheckCircle2, Users, Shield, Headphones, Zap, Lock } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

export default function TestingEnvironmentPage() {
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({})
  
  const handleImageError = (imageName: string) => {
    try {
      setImageErrors(prev => ({...prev, [imageName]: true}))
    } catch (e) {
      console.log('[v0] Image error handling for:', imageName)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Professional Testing Environment
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Experience a world-class testing environment that is modern, secure, comfortable, and fully equipped with cutting-edge technology to deliver a seamless examination experience that meets international standards.
            </p>
          </div>
        </div>
      </section>

      {/* Executive Testing Suites Section */}
      <section className="py-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Executive Testing Suites
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Every detail of our testing environment has been thoughtfully planned to promote concentration, comfort, and confidence. From our premium workstations to our advanced testing technology, Vertex Testing Services Limited provides candidates with a world-class examination experience in a secure and welcoming setting.
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <span className="text-muted-foreground">Private executive testing suites</span>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <span className="text-muted-foreground">Premium ergonomic furniture</span>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <span className="text-muted-foreground">High-performance computer workstations</span>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <span className="text-muted-foreground">Advanced noise-reduction environment</span>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <span className="text-muted-foreground">Enterprise-grade internet connectivity</span>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <span className="text-muted-foreground">Continuous CCTV security monitoring</span>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <span className="text-muted-foreground">Professional technical support on-site</span>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <span className="text-muted-foreground">International-standard testing facilities</span>
                </div>
              </div>
            </div>

            <div className="relative h-96 md:h-auto bg-secondary rounded-2xl flex items-center justify-center">
              {!imageErrors['suites'] ? (
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-07-30%20at%206.02.56%20AM-Ntzhza5t3GsZNO1MtyLFsq8mQJgKK5.jpeg"
                  alt="Executive Testing Suites with modern workstations"
                  width={600}
                  height={400}
                  className="rounded-2xl shadow-2xl w-full h-full object-cover"
                  unoptimized
                  onError={() => handleImageError('suites')}
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Testing Suites Image</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testing Facilities Grid */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-16 text-center">
            Our Facilities
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl overflow-hidden shadow-lg h-96 relative bg-secondary flex items-center justify-center">
              {!imageErrors['workstations'] ? (
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-07-30%20at%206.18.42%20AM-R1tb3RoXwafwAnpbc4XkNfKt5Ovpnj.jpeg"
                  alt="Modern testing workstations with ergonomic furniture"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover"
                  unoptimized
                  onError={() => handleImageError('workstations')}
                />
              ) : (
                <p className="text-muted-foreground">Testing Workstations</p>
              )}
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg h-96 relative bg-secondary flex items-center justify-center">
              {!imageErrors['lounge'] ? (
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-07-30%20at%206.27.56%20AM-3lNiRRaStek0ESnnQ0ZVOTSPuSMKUm.jpeg"
                  alt="Premium candidate waiting lounge with comfortable seating"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover"
                  unoptimized
                  onError={() => handleImageError('lounge')}
                />
              ) : (
                <p className="text-muted-foreground">Waiting Lounge</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Candidate Waiting Lounge */}
      <section className="py-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1 h-96 md:h-auto bg-secondary rounded-2xl flex items-center justify-center">
              {!imageErrors['lounge_image'] ? (
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-07-30%20at%206.27.56%20AM-HbdcgB9nc71F2Cu7aIW6IDtOMrFDi8.jpeg"
                  alt="Candidate Waiting Lounge at Vertex Testing Services"
                  width={600}
                  height={400}
                  className="rounded-2xl shadow-2xl w-full h-full object-cover"
                  unoptimized
                  onError={() => handleImageError('lounge_image')}
                />
              ) : (
                <div className="text-center">
                  <p className="text-xl font-semibold text-foreground">Vertex</p>
                  <p className="text-sm text-muted-foreground">Vertex Assessment Center</p>
                </div>
              )}
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Candidate Waiting Lounge
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Our executive waiting lounge has been thoughtfully designed to provide a relaxing, welcoming, and professional atmosphere before your examination. From the moment you arrive, you'll enjoy a comfortable environment that helps you stay calm, focused, and fully prepared for your test.
              </p>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-muted-foreground">Spacious and elegantly furnished seating area</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-muted-foreground">Quiet, relaxing, and distraction-free environment</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-muted-foreground">Fully air-conditioned for maximum comfort</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-muted-foreground">Modern, clean, and hygienic facilities</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-muted-foreground">Complimentary refreshments and drinking water</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-muted-foreground">Friendly and professional customer support</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-muted-foreground">Secure, well-organized reception and waiting area</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-muted-foreground">Designed to help candidates feel confident and exam-ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated Customer Success Team */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Dedicated Customer Success Team
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Our knowledgeable and customer-focused team is committed to delivering a seamless testing experience through exceptional service, expert guidance, and unwavering professionalism from registration to examination.
              </p>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-muted-foreground">Highly trained and professional personnel</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-muted-foreground">Personalized candidate assistance</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-muted-foreground">Fast and accurate registration support</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-muted-foreground">Responsive customer care services</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-muted-foreground">Professional guidance throughout your journey</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-muted-foreground">Dedicated to delivering an outstanding testing experience</span>
                </div>
              </div>
            </div>

            <div className="relative h-96 md:h-auto bg-secondary rounded-2xl flex items-center justify-center">
              {!imageErrors['team'] ? (
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-07-30%20at%206.39.57%20AM-IQT6Ll96COVZin4jx8x3BuKCuEbqTJ.jpeg"
                  alt="Professional Vertex Testing Services team"
                  width={600}
                  height={400}
                  className="rounded-2xl shadow-2xl w-full h-full object-cover"
                  unoptimized
                  onError={() => handleImageError('team')}
                />
              ) : (
                <p className="text-muted-foreground">Professional Team</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Vertex Section */}
      <section className="py-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Why Choose Vertex Testing Services
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              World-class facilities, professional support, and international standards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Shield}
              title="Secure Environment"
              description="Continuous CCTV monitoring and enterprise-grade security for a safe testing experience"
            />
            <FeatureCard
              icon={Zap}
              title="Cutting-Edge Technology"
              description="High-performance workstations with enterprise-grade internet for reliable testing"
            />
            <FeatureCard
              icon={Users}
              title="Expert Support"
              description="Highly trained professionals dedicated to your success throughout the process"
            />
            <FeatureCard
              icon={CheckCircle2}
              title="Premium Comfort"
              description="Ergonomic furniture and climate-controlled environment for optimal focus"
            />
            <FeatureCard
              icon={Headphones}
              title="Exceptional Service"
              description="Responsive customer care and personalized assistance for every candidate"
            />
            <FeatureCard
              icon={Lock}
              title="International Standards"
              description="World-class facilities meeting global testing environment requirements"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="card-premium p-8 hover:border-primary/50 group">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  )
}
