'use client'

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    testType: '',
    preferredDate: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({...prev, [name]: value}))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.testType || !formData.preferredDate) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const message = `
*New Registration Request from Vertex Testing Services Limited*

📋 *Candidate Information:*
• Name: ${formData.firstName} ${formData.lastName}
• Email: ${formData.email}
• Phone: ${formData.phone}

📝 *Test Details:*
• Test Type: ${formData.testType === 'pte-academic' ? 'PTE Academic' : 'PTE Core'}
• Preferred Date: ${formData.preferredDate}

💬 *Additional Info:*
${formData.message || 'None'}

---
This registration was submitted through our website form.
`

      const encodedMessage = encodeURIComponent(message)
      const whatsappNumber = '2347026738900'
      const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`
      
      // Open WhatsApp in new tab
      window.open(whatsappURL, '_blank')
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        testType: '',
        preferredDate: '',
        message: ''
      })
      
      alert('Please confirm your details in WhatsApp. Our team will respond shortly!')
    } catch (error) {
      console.error('[v0] Error sending to WhatsApp:', error)
      alert('Error sending registration. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-card border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Begin Your PTE Journey with Confidence
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional registration assistance for PTE Academic and PTE Core examinations
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            {/* Registration Services */}
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-foreground">Register For</h2>

              <RegisterCard
                title="PTE Academic"
                description="For university admission, study abroad, and international opportunities"
                href="/pte-academic"
                color="primary"
              />

              <RegisterCard
                title="PTE Core"
                description="For Canadian immigration and immigration pathway programs"
                href="/pte-core"
                color="accent"
              />

              <RegisterCard
                title="Preparation Classes"
                description="Comprehensive training programs to prepare for your PTE examination"
                href="/preparation"
                color="primary"
              />

              <RegisterCard
                title="Mock Tests"
                description="Realistic practice examinations with detailed performance feedback"
                href="/mock-tests"
                color="accent"
              />
            </div>

            {/* Registration Form */}
            <div className="p-8 rounded-lg bg-card border border-border">
              <h2 className="text-3xl font-bold text-foreground mb-6">Registration Form</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary transition"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary transition"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary transition"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary transition"
                    placeholder="+234 123 456 7890"
                  />
                </div>

                <div>
                  <label htmlFor="testType" className="block text-sm font-medium text-foreground mb-2">
                    Select Test Type *
                  </label>
                  <select
                    id="testType"
                    name="testType"
                    value={formData.testType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary transition"
                  >
                    <option value="">Choose a test</option>
                    <option value="pte-academic">PTE Academic</option>
                    <option value="pte-core">PTE Core</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="preferredDate" className="block text-sm font-medium text-foreground mb-2">
                    Preferred Registration Date *
                  </label>
                  <input
                    type="date"
                    id="preferredDate"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary transition"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Additional Information
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary transition resize-none"
                    placeholder="Any questions or additional information..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Complete Registration'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <p className="text-xs text-muted-foreground mt-4">
                Your registration details will be sent directly to our WhatsApp. Our team will respond within 24 hours.
              </p>
            </div>
          </div>

          {/* Registration Benefits */}
          <div className="bg-card border border-border rounded-lg p-8 md:p-12 mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-8">What You Get</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <BenefitItem text="Fast and reliable registration processing" />
              <BenefitItem text="Professional registration guidance" />
              <BenefitItem text="Access to preparation resources" />
              <BenefitItem text="Flexible scheduling options" />
              <BenefitItem text="Dedicated support team" />
              <BenefitItem text="Exam day preparation materials" />
            </div>
          </div>

          {/* FAQs */}
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-foreground mb-8">Registration FAQs</h2>
            <div className="space-y-6">
              <FAQItem
                question="How long does registration take?"
                answer="Our registration process is fast and efficient. We typically complete registrations within 24-48 hours of receiving your form and necessary documentation."
              />
              <FAQItem
                question="What documents do I need?"
                answer="You will need a valid government-issued identification document. Our team will provide you with a complete checklist of required documents during the registration process."
              />
              <FAQItem
                question="Can I change my test date?"
                answer="Yes, rescheduling is possible depending on availability and applicable examination policies. Contact our team to discuss your options."
              />
              <FAQItem
                question="What payment methods do you accept?"
                answer="We accept multiple payment methods including bank transfers, card payments, and cash payment. Our team will discuss payment options with you during registration."
              />
              <FAQItem
                question="When will I receive my registration confirmation?"
                answer="You will receive a confirmation email and SMS within 24 hours of completing your registration. Our team will also call you to confirm all details."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground mt-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Fill out the registration form above or contact our team for assistance with your registration process.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-foreground text-primary font-medium hover:bg-primary-foreground/90 transition"
          >
            Contact Us for Help
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function RegisterCard({
  title,
  description,
  href,
  color,
}: {
  title: string
  description: string
  href: string
  color: 'primary' | 'accent'
}) {
  const bgColor = color === 'primary' ? 'bg-primary/10' : 'bg-accent/10'
  const borderColor = color === 'primary' ? 'border-primary/50' : 'border-accent/50'
  const textColor = color === 'primary' ? 'text-primary' : 'text-accent'

  return (
    <Link href={href}>
      <div className={`p-6 rounded-lg border ${borderColor} ${bgColor} hover:${bgColor.replace('/10', '/20')} transition`}>
        <h3 className={`text-xl font-semibold ${textColor} mb-2`}>{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border">
      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
      <span className="text-muted-foreground">{text}</span>
    </div>
  )
}

function FAQItem({
  question,
  answer,
}: {
  question: string
  answer: string
}) {
  return (
    <div className="p-6 rounded-lg bg-card border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-3">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  )
}
