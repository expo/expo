import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CheckCircle2, Lightbulb, Users, Target, Zap, Shield } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'About Vertex Testing Services Limited | Professional PTE Services',
  description: 'Learn about Vertex Testing Services Limited - excellence in PTE registration, preparation, and mock testing since inception.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-card border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              VERTEX TESTING SERVICES LIMITED
            </h1>
            <p className="text-xl text-muted-foreground">
              A subsidiary of Proxy Cooding School.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-invert max-w-none">
            <div className="space-y-12">
              {/* Introduction */}
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">WHO WE ARE</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  Vertex Testing Services Limited, a subsidiary of Proxy Coding School, is a professional examination registration organization dedicated to connecting candidates with global educational, professional, and immigration opportunities.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  We provide registration support for a wide range of internationally recognized examinations, including: PTE • IELTS • TOEFL • GRE • GMAT • CELPIP • SAT • OET and other international examinations.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  Our goal is to make examination registration simple, reliable, transparent, and accessible, while providing candidates with professional guidance throughout their examination journey.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  Through our integration with Proxy Coding School, we are expanding beyond examinations into technology, digital skills, and career development, creating a broader platform that brings together assessment, education, technology, and global opportunities.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  At Vertex, we are guided by: Integrity • Professionalism • Accuracy • Innovation • Excellence
                </p>
              </div>

              {/* Mission, Vision, Values */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <ValueCard
                  icon={Target}
                  title="Our Mission"
                  description="To provide reliable registration services, high-quality preparation programs, realistic mock testing, and exceptional customer support that help candidates achieve their educational, professional, and immigration aspirations."
                />
                <ValueCard
                  icon={Lightbulb}
                  title="Our Vision"
                  description="To become one of Africa's leading assessment and candidate support centres, recognized for professionalism, innovation, service excellence, and the delivery of world-class examination support solutions."
                />
                <ValueCard
                  icon={Users}
                  title="Our Focus"
                  description="Professionalism, accuracy, innovation, and exceptional customer care. We believe success begins with proper preparation, integrity, and a commitment to excellence."
                />
              </div>

              {/* Core Values */}
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-8">Our Core Values</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <CoreValueCard
                    title="Precision"
                    description="We pay attention to every detail to ensure accuracy and professionalism in all our operations."
                  />
                  <CoreValueCard
                    title="Integrity"
                    description="We operate honestly, ethically, and transparently in every interaction with our candidates and partners."
                  />
                  <CoreValueCard
                    title="Excellence"
                    description="We continually strive for the highest standards in service delivery and candidate outcomes."
                  />
                  <CoreValueCard
                    title="Innovation"
                    description="We embrace modern technology and continuous improvement to serve candidates better."
                  />
                  <CoreValueCard
                    title="Professionalism"
                    description="Every candidate is treated with respect, courtesy, and efficiency in all interactions."
                  />
                  <CoreValueCard
                    title="Customer Success"
                    description="Our greatest achievement is helping our candidates succeed in their PTE journey and goals."
                  />
                </div>
              </div>

              {/* Why Choose Vertex */}
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-8">Why Choose Vertex</h2>
                <div className="space-y-4">
                  <WhyChooseItem
                    title="Professional Registration Support"
                    description="We assist candidates throughout the registration process with accuracy and efficiency, ensuring a stress-free experience."
                  />
                  <WhyChooseItem
                    title="Modern Learning Environment"
                    description="Comfortable facilities designed to provide an excellent learning experience with all necessary amenities."
                  />
                  <WhyChooseItem
                    title="Expert Preparation"
                    description="Structured coaching and practical guidance to help candidates improve their performance and achieve target scores."
                  />
                  <WhyChooseItem
                    title="Realistic Mock Tests"
                    description="Practice in an environment that closely resembles the actual computer-based test experience with professional evaluation."
                  />
                  <WhyChooseItem
                    title="Exceptional Customer Service"
                    description="Friendly, responsive, and professional support before and after registration to address all your needs."
                  />
                  <WhyChooseItem
                    title="Trusted Standards"
                    description="We are committed to maintaining high standards of quality, integrity, and professionalism in everything we do."
                  />
                </div>
              </div>

              {/* Our Commitment */}
              <div className="bg-card border border-border rounded-xl p-8 md:p-12">
                <h2 className="text-3xl font-bold text-foreground mb-6">Our Commitment</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  At Vertex Testing Services Limited, we are committed to creating an environment where every candidate feels confident, supported, and fully prepared to achieve their goals.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Through continuous improvement, quality service, and a passion for excellence, we aim to become the preferred destination for assessment support services across Nigeria and beyond.
                </p>
              </div>

              {/* CTA */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground mb-6">Ready to Begin Your Journey?</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join hundreds of successful candidates who have trusted Vertex Testing Services Limited for their PTE preparation and registration needs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/register"
                    className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition text-center"
                  >
                    Register Now
                  </Link>
                  <Link
                    href="/contact"
                    className="px-6 py-3 rounded-lg border border-primary text-primary font-medium hover:bg-primary/5 transition text-center"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function ValueCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="p-8 rounded-xl bg-card border border-border">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function CoreValueCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition">
      <div className="flex items-start gap-3 mb-3">
        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}

function WhyChooseItem({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex gap-4 p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition">
      <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
