/** Color-only scrubbing leaves the shared motion clock and cloud texture intact. */
export function mountBlueHour() {
  const slider = document.querySelector<HTMLInputElement>('#blue-hour');
  const label = document.querySelector<HTMLOutputElement>('#blue-hour-label');
  if (!slider || !label) return;
  const rgb = (hex: string) => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
  const colors = Array.from(document.querySelectorAll<SVGElement>('[data-blue-hour-end]'), element => {
    const attribute = element.tagName === 'stop' ? 'stop-color' : 'fill';
    const original = element.getAttribute(attribute)!;
    return { element, attribute, original, start: rgb(original), end: rgb(element.dataset.blueHourEnd!) };
  });
  const cloudChannels = Array.from(document.querySelectorAll('#cloud-dusk feComponentTransfer > *'));
  const stars = document.querySelector<SVGElement>('#stars');
  const texture = document.querySelector<SVGElement>('.water-texture');
  const ripples = document.querySelector<SVGElement>('.ambient-ripples');
  function update() {
    const time = Math.max(0, Math.min(1, Number(slider!.value) / 100));
    const mix = time * time * (3 - 2 * time);
    for (const { element, attribute, original, start, end } of colors) {
      const color = start.map((value, channel) => Math.round(value + (end[channel] - value) * mix));
      element.setAttribute(attribute, time === 0 ? original : `rgb(${color.join(',')})`);
    }
    // Fade warm cloud illumination while retaining cool structure and shared reflections.
    cloudChannels.forEach((channel, index) => channel.setAttribute('slope', String(1 - mix * [.66, .60, .43][index])));
    stars?.style.setProperty('filter', `brightness(${1 + mix * .5})`);
    texture?.setAttribute('opacity', String(1 - mix * .5));
    ripples?.setAttribute('opacity', String(.55 - mix * .22));
    label!.value = time === 0 ? 'Early blue hour' : time === 1 ? 'End of blue hour' : time < .5 ? 'Deepening blue hour' : 'Late blue hour';
    slider!.setAttribute('aria-valuetext', time === 0 ? 'Beginning of blue hour' : time === 1 ? 'End of blue hour' : `${Math.round(time * 100)}% through blue hour`);
  }
  slider.addEventListener('input', update);
  update();
}
