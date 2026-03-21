import qrcode
import sys


def generate_qr(url, output="qr-code.png"):
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(output)
    print(f"QR code saved to {output}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate-qr.py <url> [output.png]")
        sys.exit(1)
    url = sys.argv[1]
    output = sys.argv[2] if len(sys.argv) > 2 else "qr-code.png"
    generate_qr(url, output)
