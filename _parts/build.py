from pathlib import Path

root = Path(r"D:\divyanssh\govindam")
css = (root / "_parts" / "styles.css").read_text(encoding="utf-8")
common = (root / "_parts" / "common.js").read_text(encoding="utf-8")
motion = (root / "_parts" / "motion.js").read_text(encoding="utf-8")
book = "https://govindamroyalstay.pripgo.com/"
pages = [
    ("index.html", "Govindam Royal Stay", "A modern, family-friendly hotel on Amer Road in Jaipur, near Govind Dev Ji Temple.", "home", ""),
    ("rooms.html", "Rooms & Stay · Govindam Royal Stay", "Six room categories at Govindam Royal Stay, Jaipur, with occupancy taken from the reservation list.", "", "always"),
    ("gallery.html", "Gallery · Govindam Royal Stay", "Photographs of Govindam Royal Stay in Jaipur.", "", "always"),
    ("about.html", "About · Govindam Royal Stay", "The story of Govindam Royal Stay, a family hotel near Talkatora Lake and Govind Dev Ji Temple.", "", "always"),
    ("contact.html", "Contact · Govindam Royal Stay", "Address, phone, map and booking enquiry for Govindam Royal Stay, Jaipur.", "", "always"),
]
nav_items = [
    ("index.html", "Home"),
    ("rooms.html", "Rooms"),
    ("gallery.html", "Gallery"),
    ("about.html", "About"),
    ("contact.html", "Contact"),
]

def nav(current):
    links = []
    for href, label in nav_items:
        current_attr = ' aria-current="page"' if href == current else ""
        links.append(f'<a data-internal href="{href}"{current_attr}>{label}</a>')
    menu = []
    for href, label in nav_items:
        menu.append(f'<a data-internal href="{href}">{label}</a>')
    menu.append(f'<a href="{book}">Book your stay</a>')
    return f'''<a class="skip" href="#content">Skip to content</a>
<div class="progress" aria-hidden="true"></div>
<div class="curtain" aria-hidden="true"></div>
<header class="nav">
  <a class="brand" data-internal href="index.html"><b>Govindam</b><small>Royal Stay</small></a>
  <nav class="nav-links" aria-label="Primary">{''.join(links)}</nav>
  <a class="nav-book btn btn-fill" href="{book}">Book your stay</a>
  <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu"><span></span><span class="sr">Menu</span></button>
</header>
<div class="menu" id="menu">{''.join(menu)}</div>
<a class="float-book btn btn-fill" href="{book}">Book your stay</a>'''

footer = f'''<footer class="footer">
  <div class="footer-crown">
    <div class="footer-door">
      <svg class="footer-arch" viewBox="0 0 760 170" aria-hidden="true">
        <path d="M18 170 V78 C18 18 742 18 742 78 V170"/>
        <path class="wine" d="M78 170 V96 C78 48 682 48 682 96 V170"/>
        <path d="M250 78 C290 46 350 46 380 78 C410 46 470 46 510 78"/>
      </svg>
      <p class="footer-name">Govindam<span>Royal Stay</span></p>
      <nav class="footer-nav" aria-label="Footer">
        <a data-internal href="index.html">Home</a>
        <a data-internal href="rooms.html">Rooms</a>
        <a data-internal href="gallery.html">Gallery</a>
        <a data-internal href="about.html">About</a>
        <a data-internal href="contact.html">Contact</a>
      </nav>
    </div>
    <aside class="footer-plate">
      <p class="footer-kicker">The house</p>
      <p>76-B, Talkatora Colony<br>J.D.A. Market, Brahampuri<br>Jaipur, Rajasthan</p>
      <p><a href="tel:+919829057118">+91 98290 57118</a><br><a href="mailto:govindamroyalstay@gmail.com">govindamroyalstay@gmail.com</a></p>
      <p class="footer-hours">Arrivals 12:00 PM<br>Departures 10:00 AM<br>Sixteen rooms</p>
      <p class="footer-social"><a href="https://www.instagram.com/govindamroyalstay/">Instagram</a><a href="https://g.page/r/CeTVBOozsCTvEAI/review">Google reviews</a></p>
    </aside>
  </div>
  <div class="footer-close">
    <p>Availability and rates are confirmed on the reservation page. A stay is not booked here.</p>
    <a class="btn btn-fill" href="{book}">Book your stay</a>
  </div>
  <p class="footer-legal">© 2026 Govindam Royal Stay. Jaipur landmark photographs are from Wikimedia Commons and are not pictures of the hotel.</p>
</footer>
<div class="lightbox" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Photograph">
  <button class="lb-btn lb-x" type="button">Close</button>
  <button class="lb-btn lb-prev" type="button" aria-label="Previous photograph">‹</button>
  <img alt="">
  <button class="lb-btn lb-next" type="button" aria-label="Next photograph">›</button>
  <p></p>
</div>'''

for filename, title, description, klass, solid in pages:
    body = (root / "_parts" / "pages" / filename).read_text(encoding="utf-8")
    html = f'''<!DOCTYPE html>
<html lang="en" class="{klass}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="icon" href="favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,460;9..144,560&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<script>if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("reduce");</script>
<style>
{css}
</style>
</head>
<body data-solid="{solid}">
{nav(filename)}
<main id="content">
{body}
</main>
{footer}
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js"></script>
<script>
{common}
</script>
<script>
{motion}
</script>
</body>
</html>
'''
    (root / filename).write_text(html, encoding="utf-8")
    print(filename, len(html))
