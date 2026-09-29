'use client'

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ArrowRight, CheckCircle2, Users, Zap, Trophy, BookOpen, Sparkles, Target, Award, Shield } from 'lucide-react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

export default function HomePage() {
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({})
  
  const handleImageError = (imageName: string) => {
    try {
      setImageErrors(prev => ({...prev, [imageName]: true}))
    } catch (e) {
      console.log('[v0] Image error:', imageName)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Premium Hero Section */}
      <section className="relative py-24 md:py-40 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  Premium PTE Services in Abeokuta Ogun State
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                  Master the PTE with Confidence
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  Your Trusted Partner for PTE Success. Professional registration, expert preparation, and realistic mock tests.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Link
                  href="/register"
                  className="px-8 py-4 rounded-xl bg-white text-primary font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105 active:scale-95 inline-flex items-center justify-center gap-2 shadow-lg"
                >
                  Register Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-4 rounded-xl border-2 border-white text-white font-semibold hover:bg-white/10 transition-all duration-300 inline-flex items-center justify-center"
                >
                  Get in Touch
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative w-full h-96">
                <div className="absolute inset-0 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Trophy className="w-24 h-24 text-white/80 mx-auto" />
                    <p className="text-white text-lg font-semibold">Vertex Testing Services Limited</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Services Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              What We Offer
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Comprehensive PTE registration and preparation services designed for your success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ServiceCard
              icon={BookOpen}
              title="PTE Academic"
              description="Fast, reliable, and professional registration assistance for PTE Academic candidates."
              href="/pte-academic"
              color="from-blue-500 to-cyan-500"
            />
            <ServiceCard
              icon={Zap}
              title="PTE Core"
              description="Professional support for Canadian immigration pathways."
              href="/pte-core"
              color="from-cyan-500 to-teal-500"
            />
            <ServiceCard
              icon={Users}
              title="Preparation Classes"
              description="Physical, online, weekend, intensive, and one-on-one training options."
              href="/preparation"
              color="from-teal-500 to-emerald-500"
            />
            <ServiceCard
              icon={Trophy}
              title="Mock Tests"
              description="Realistic computer-based examinations with detailed performance feedback."
              href="/mock-tests"
              color="from-emerald-500 to-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Why Choose Vertex Section */}
      <section className="py-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Why Candidates Choose Vertex
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Excellence in every interaction, professionalism in every service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <WhyChooseCard
              icon={CheckCircle2}
              title="Professional Support"
              description="Our team guides you through every stage with accuracy and expertise."
            />
            <WhyChooseCard
              icon={Award}
              title="Modern Learning Environment"
              description="Comfortable facilities designed with quality and professionalism."
            />
            <WhyChooseCard
              icon={Target}
              title="Expert Preparation"
              description="Comprehensive training programs to maximize your performance."
            />
            <WhyChooseCard
              icon={BookOpen}
              title="Realistic Mock Tests"
              description="Practice in exam-like environment reflecting the actual PTE."
            />
            <WhyChooseCard
              icon={Users}
              title="Experienced Team"
              description="Dedicated instructors committed to your success."
            />
            <WhyChooseCard
              icon={Sparkles}
              title="Exceptional Support"
              description="Available to answer questions and provide guidance."
            />
          </div>
        </div>
      </section>

      {/* About Vertex Section */}
      <section className="py-24 bg-secondary/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  Excellence Begins Here
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Vertex Testing Services Limited is committed to helping individuals achieve their international education, career, and immigration goals through high-quality PTE registration and preparation services.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-lg bg-card hover:bg-primary/5 transition">
                  <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">Our Focus</h3>
                    <p className="text-sm text-muted-foreground">Professionalism, accuracy, innovation, and exceptional customer care</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-lg bg-card hover:bg-primary/5 transition">
                  <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">Our Belief</h3>
                    <p className="text-sm text-muted-foreground">Every candidate deserves expert guidance, quality training, and supportive environment</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-lg bg-card hover:bg-primary/5 transition">
                  <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">Our Commitment</h3>
                    <p className="text-sm text-muted-foreground">Creating confidence and success for every candidate we serve</p>
                  </div>
                </div>
              </div>

              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-accent font-semibold hover:gap-3 transition-all group"
              >
                Learn More About Vertex
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="relative h-96 hidden lg:block">
              <div className="absolute inset-0 gradient-accent rounded-3xl opacity-80 blur-2xl" />
              <div className="absolute inset-0 bg-card rounded-3xl border border-accent/20 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Target className="w-20 h-20 text-accent/40 mx-auto" />
                  <p className="text-foreground font-bold text-xl">Your Success</p>
                  <p className="text-muted-foreground text-sm">Is Our Priority</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Testimonials Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Success Stories
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Hear from our successful candidates about their experience with us
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="The preparation classes were well organized, and the instructors explained every section of the exam clearly. The mock tests gave me the confidence I needed."
              author="Sarah Johnson"
              status="PTE Academic - 89 Points"
              stars={5}
            />
            <TestimonialCard
              quote="I was impressed by the professionalism of the staff. From registration to preparation, everything was smooth and stress-free. Highly recommended!"
              author="Ahmed Hassan"
              status="PTE Core - 82 Points"
              stars={5}
            />
            <TestimonialCard
              quote="The computer-based mock tests helped me understand the exam format perfectly. The detailed feedback allowed me to improve significantly."
              author="Adeola Malik"
              status="PTE Academic - 90 Points"
              stars={5}
            />
          </div>
        </div>
      </section>

      {/* World-Class Facilities Section */}
      <section className="py-24 bg-secondary/20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              World-Class Testing Facilities
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Experience our premium testing environment designed for comfort, concentration, and success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl overflow-hidden shadow-lg h-96 relative bg-secondary flex items-center justify-center">
              {!imageErrors['workstations_home'] ? (
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-07-30%20at%206.18.42%20AM-R1tb3RoXwafwAnpbc4XkNfKt5Ovpnj.jpeg"
                  alt="Modern testing workstations with ergonomic furniture"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover"
                  unoptimized
                  onError={() => handleImageError('workstations_home')}
                />
              ) : (
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">Premium Workstations</p>
                  <p className="text-sm text-muted-foreground">High-performance computers & ergonomic seating</p>
                </div>
              )}
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg h-96 relative bg-secondary flex items-center justify-center">
              {!imageErrors['lounge_home'] ? (
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-07-30%20at%206.27.56%20AM-HbdcgB9nc71F2Cu7aIW6IDtOMrFDi8.jpeg"
                  alt="Premium candidate waiting lounge with comfortable seating"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover"
                  unoptimized
                  onError={() => handleImageError('lounge_home')}
                />
              ) : (
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">Waiting Lounge</p>
                  <p className="text-sm text-muted-foreground">Comfortable space to relax before your test</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Secure Environment</h3>
              <p className="text-muted-foreground">Enterprise-grade security with 24/7 CCTV monitoring</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Advanced Technology</h3>
              <p className="text-muted-foreground">Cutting-edge testing technology & stable internet</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Professional Support</h3>
              <p className="text-muted-foreground">Dedicated staff to assist you throughout your test</p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Begin Your PTE Journey?
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-10">
            Take the next step toward achieving your study, work, or immigration goals. Our experienced team is here to guide you every step of the way.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
          >
            Register Today
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function ServiceCard({
  icon: Icon,
  title,
  description,
  href,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  href: string
  color: string
}) {
  return (
    <Link href={href}>
      <div className="card-premium p-8 group hover:border-accent/50 h-full">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        <div className="mt-6 flex items-center gap-2 text-accent text-sm font-semibold group-hover:gap-3 transition-all">
          Learn more
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  )
}

function WhyChooseCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="card-premium p-8 hover:border-accent/50 group">
      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition">
        <Icon className="w-6 h-6 text-accent" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function TestimonialCard({
  quote,
  author,
  status,
  stars,
}: {
  quote: string
  author: string
  status: string
  stars: number
}) {
  return (
    <div className="card-premium p-8 hover:border-accent/50">
      <div className="flex gap-1 mb-4">
        {[...Array(stars)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-accent text-accent" />
        ))}
      </div>
      <p className="text-foreground mb-6 italic text-base leading-relaxed">"{quote}"</p>
      <div>
        <p className="font-bold text-foreground">{author}</p>
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  )
}
