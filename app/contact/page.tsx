'use client'

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react'
import { useState } from 'react'

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-card border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            We&apos;re Here to Help
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you have questions about PTE registration, preparation classes, mock tests, or any of our services, our dedicated team is ready to assist you.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-8">Get in Touch</h2>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Visit Our Centre</h3>
                  <p className="text-muted-foreground">
                    Proxy Building<br />
                    Prince Dele Alao Close, Olokuta Junction Idi-aba<br />
                    Abeokuta, 111101, Ogun State
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Phone</h3>
                  <a
                    href="tel:+2348147138191"
                    className="text-muted-foreground hover:text-primary transition"
                  >
                    +234 814 713 8191
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Email</h3>
                  <a
                    href="mailto:info@vertextestingservices.com"
                    className="text-muted-foreground hover:text-primary transition"
                  >
                    info@vertextestingservices.com
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Business Hours</h3>
                  <div className="text-muted-foreground space-y-1">
                    <p>Monday – Friday: 8:00 AM – 6:00 PM</p>
                    <p>Saturday: 9:00 AM – 4:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <ContactForm />
          </div>

          {/* Additional Services */}
          <div className="bg-card border border-border rounded-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold text-foreground mb-8">We Can Assist With</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ServiceItem text="PTE Academic Registration" />
              <ServiceItem text="PTE Core Registration" />
              <ServiceItem text="Preparation Class Enquiries" />
              <ServiceItem text="Mock Test Bookings" />
              <ServiceItem text="General Information" />
              <ServiceItem text="Corporate Partnerships" />
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-card border-t border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Find Us</h2>
          <div className="w-full h-96 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-primary/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Vertex Testing Services Limited, Proxy Building, Prince Dele Alao Close, Olokuta Junction Idi-aba, Abeokuta, 111101, Ogun State
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.phone || !formData.subject || !formData.message) {
      alert('Please fill in all fields')
      return
    }

    setIsLoading(true)

    // Create WhatsApp message with form details
    const whatsappMessage = `Hello Vertex Testing Services Limited!

Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
Subject: ${formData.subject}

Message:
${formData.message}`

    // WhatsApp Business Phone Number (Nigeria format)
    const phoneNumber = '2348147138191' // Vertex WhatsApp number
    const encodedMessage = encodeURIComponent(whatsappMessage)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

    // Open WhatsApp in new window
    window.open(whatsappUrl, '_blank')

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    })

    setIsLoading(false)
  }

  return (
    <div className="p-8 rounded-lg bg-card border border-border">
      <h2 className="text-3xl font-bold text-foreground mb-6">Send us a Message</h2>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary transition"
            placeholder="Your name"
          />
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
            onChange={handleChange}
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
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary transition"
            placeholder="+234 123 456 7890"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary transition"
            placeholder="How can we help?"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={5}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary transition resize-none"
            placeholder="Your message here..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? 'Opening WhatsApp...' : 'Send via WhatsApp'}
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}

function ServiceItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border">
      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      <span className="text-muted-foreground">{text}</span>
    </div>
  )
}
