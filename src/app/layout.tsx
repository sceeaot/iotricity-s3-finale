import "./globals.css";
import { FontProvider } from "./font-provider";

export const metadata = {
  title: "IoTRICITY // Season 3",
  description: "EE Students Chapter - Academy of Technology",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <FontProvider>{children}</FontProvider>
      </body>
    </html>
  );
}

