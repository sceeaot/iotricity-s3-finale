import "./globals.css";

export const metadata = {
  title: "IoTRICITY // Season 3",
  description: "EE Students Chapter - Academy of Technology",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
