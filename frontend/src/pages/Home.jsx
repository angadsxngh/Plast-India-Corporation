import * as React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, Recycle, Award, Phone } from "lucide-react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
function Home() {
  const { user } = useUser();
  const navigate = useNavigate();
  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);
  return (
    <div className="flex flex-col scroll-smooth">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-yellow-50 py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Leading Provider of
              <span className="block text-blue-600">Quality Plumbing</span>
              <span className="block text-blue-600">and Bathware</span>
            </h1>
            <p className="mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl md:text-2xl">
              Plast India Corporation delivers innovative solutions for
              industries across India with a commitment to quality and
              reliability.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-blue-600 text-lg hover:bg-blue-700"
                asChild
              >
                <a href="#products">
                  View Products <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg"
                asChild
              >
                <a href="#contact">Contact Us</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
              About Plast India Corporation
            </h2>
            <p className="mb-6 text-lg text-muted-foreground">
              With years of experience in the plastic manufacturing industry, we
              have established ourselves as a trusted name in delivering
              high-quality plastic products and solutions.
            </p>
            <p className="text-lg text-muted-foreground">
              Our commitment to innovation, quality assurance, and customer
              satisfaction has made us a preferred choice for businesses across
              various sectors.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl md:text-5xl">
            Why Choose Us?
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="flex flex-col items-center rounded-lg bg-white p-8 text-center shadow-md transition-shadow hover:shadow-lg">
              <div className="mb-4 rounded-full bg-blue-100 p-4">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">
                Wide Product Range
              </h3>
              <p className="text-muted-foreground">
                Extensive selection of plastic products catering to diverse
                industry needs and specifications.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center rounded-lg bg-white p-8 text-center shadow-md transition-shadow hover:shadow-lg">
              <div className="mb-4 rounded-full bg-green-100 p-4">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">
                Premium Quality
              </h3>
              <p className="text-muted-foreground">
                Stringent quality control measures ensuring durable and
                reliable products that meet international standards.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center rounded-lg bg-white p-8 text-center shadow-md transition-shadow hover:shadow-lg">
              <div className="mb-4 rounded-full bg-purple-100 p-4">
                <Recycle className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">
                Eco-Friendly Solutions
              </h3>
              <p className="text-muted-foreground">
                Committed to sustainable practices and offering
                environmentally responsible plastic solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="inventory" className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl md:text-5xl">
            Our Product Categories
          </h2>
          <p className="mb-12 text-center text-lg text-muted-foreground">
            Comprehensive range of plastic products for various applications
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Industrial Plastics",
              "Packaging Materials",
              "Construction Products",
              "Consumer Goods",
              "Agricultural Products",
              "Automotive Components",
              "Medical Grade Plastics",
              "Custom Solutions",
            ].map((category, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-gray-200 bg-white p-6 text-center transition-all hover:border-blue-400 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold">{category}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section id="contact" className="bg-blue-600 py-16 text-white md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <Phone className="mb-6 h-16 w-16" />
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
              Get in Touch
            </h2>
            <p className="mb-8 max-w-2xl text-lg sm:text-xl">
              Ready to discuss your plastic product requirements? Our team is
              here to help you find the perfect solution for your business.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-lg text-blue-600 hover:bg-gray-100"
              >
                Call Us Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-lg text-white hover:bg-white hover:text-blue-600"
              >
                Send Inquiry
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

