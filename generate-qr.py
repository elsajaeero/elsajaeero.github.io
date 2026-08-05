import argparse

import qrcode


def generate_qr(url, output="qr-code.png", box_size=10, transparent=False):
    qr = qrcode.QRCode(version=1, box_size=box_size, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    back_color = "transparent" if transparent else "white"
    img = qr.make_image(fill_color="black", back_color=back_color)
    img.save(output)
    print(f"QR code saved to {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a QR code PNG for a URL")
    parser.add_argument("url")
    parser.add_argument("output", nargs="?", default="qr-code.png")
    parser.add_argument("--transparent", action="store_true",
                        help="transparent background instead of white")
    parser.add_argument("--box-size", type=int, default=10,
                        help="pixels per QR module (default 10; use 30+ for small print)")
    args = parser.parse_args()
    generate_qr(args.url, args.output, args.box_size, args.transparent)
