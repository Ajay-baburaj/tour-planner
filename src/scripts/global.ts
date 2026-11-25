const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector<HTMLElement>('.site-header');
const menu = document.querySelector<HTMLButtonElement>('.menu-toggle');
const nav = document.getElementById('main-nav');
const mega = document.querySelector<HTMLDetailsElement>('.mega');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  nav?.classList.toggle('is-open', open);
});
function closeMenu() {
  if (mega) mega.open = false;
  if (menu?.getAttribute('aria-expanded') === 'true') menu.click();
}
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', (event) => {
  if (event.target instanceof Element && !event.target.closest('.site-header')) closeMenu();
});
let previousY = scrollY;
addEventListener('scroll', () => {
  const y = Math.max(scrollY, 0);
  if (Math.abs(y - previousY) < 6) return;
  header?.classList.toggle('is-hidden', y > 145 && y > previousY && !header.matches(':focus-within') && !nav?.classList.contains('is-open') && !mega?.open);
  previousY = y;
}, {passive:true});

const drawer = document.querySelector<HTMLDialogElement>('#trip-enquiry');
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const trigger = event.target.closest<HTMLElement>('[data-enquire]');
  if (trigger && drawer) {
    const context = trigger.dataset.enquire || 'Trip planning';
    const form = drawer.querySelector<HTMLFormElement>('form');
    if (form) {
      form.dataset.context = context;
      const field = form.elements.namedItem('Enquiry');
      if (field instanceof HTMLInputElement) field.value = context;
    }
    if (!drawer.open) drawer.showModal();
  }
  if (event.target.closest('[data-close]') || event.target === drawer) drawer?.close();
});
document.querySelectorAll<HTMLFormElement>('[data-lead]').forEach(form => {
  const status = form.querySelector<HTMLElement>('.form-status')!;
  const result = form.querySelector<HTMLElement>('.form-result')!;
  const text = result.querySelector<HTMLTextAreaElement>('textarea')!;
  const sendButton = form.querySelector<HTMLButtonElement>('[type=submit]')!;
  const continueLink = form.querySelector<HTMLAnchorElement>('[data-continue]');
  const message = (data = new FormData(form)) => {
    const entries = [...data.entries()].filter(([key,value]) => !['Enquiry','_gotcha'].includes(key) && String(value).trim());
    return [`Hi, I’m enquiring about ${form.dataset.context}.`, ...entries.map(([name,value]) => `${name==='email' ? 'Email' : name}: ${value}`)].join('\n');
  };
  const chatUrl = () => `https://wa.me/${form.dataset.whatsapp?.replace(/\D/g,'')}?text=${encodeURIComponent(message())}`;
  form.querySelector('[data-form-chat]')?.addEventListener('click', () => {
    if (form.reportValidity() && !new FormData(form).get('_gotcha')) window.open(chatUrl(), '_blank', 'noopener');
  });
  form.querySelector('[data-copy]')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(text.value); status.textContent = 'Enquiry copied.'; }
    catch { text.focus(); text.select(); status.textContent = 'Select and copy your enquiry using your device’s copy command.'; }
  });
  const travelDate=form.querySelector<HTMLInputElement>('[type=date]');
  if(travelDate) travelDate.min=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const phone=form.querySelector<HTMLInputElement>('[type=tel]');
  const clearError=(field:HTMLElement)=>{
    const error=field.parentElement?.querySelector('.field-error');
    if(error) error.textContent='';
    field.removeAttribute('aria-invalid');
  };
  phone?.addEventListener('input',()=>{
    const value=phone.value.trim();
    const digits=value.replace(/[^0-9]/g,'');
    phone.setCustomValidity(!value || (/^[+0-9 ().-]+$/.test(value) && digits.length>=7 && digits.length<=15) ? '' : 'Enter a phone number with 7 to 15 digits.');
  });
  form.addEventListener('invalid', event => {
    const field=event.target;
    if(!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement)) return;
    let error=field.parentElement?.querySelector('.field-error');
    if(!error && field.parentElement){
      error=document.createElement('span');
      error.className='field-error';
      error.id=`${status.id}-${field.name.replace(/[^A-Za-z0-9]/g,'-')}`;
      field.setAttribute('aria-describedby',error.id);
      field.parentElement.append(error);
    }
    if(error) error.textContent=field.validationMessage;
    field.setAttribute('aria-invalid','true');
  }, true);
  for(const eventName of ['input','change']) form.addEventListener(eventName, event => {
    if(event.target instanceof HTMLElement) clearError(event.target);
    if(!result.hidden) result.hidden = true;
    status.textContent = '';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sendButton.disabled || !form.reportValidity()) return;
    const data = new FormData(form);
    if (data.get('_gotcha')) return;
    const textToSend = message(data);
    const whatsappLink = continueLink ? `https://wa.me/${form.dataset.whatsapp?.replace(/\D/g,'')}?text=${encodeURIComponent(textToSend)}` : '';
    text.value = textToSend;
    if (continueLink) continueLink.href = whatsappLink;
    const endpoint = form.getAttribute('action');
    if (!endpoint) {
      result.hidden = false;
      status.textContent = 'Your enquiry is ready to copy. Online delivery is unavailable in this preview.';
      return;
    }
    sendButton.disabled = true;
    const fields = form.querySelector('fieldset');
    if (fields) fields.disabled = true;
    status.textContent = 'Sending your enquiry…';
    const chatWindow = form.dataset.kind === 'taxi' && continueLink ? window.open('about:blank', '_blank') : null;
    if (chatWindow) chatWindow.opener = null;
    try {
      const response = await fetch(endpoint, {method:'POST', body:data, headers:{Accept:'application/json'}});
      if (!response.ok) throw new Error('Delivery failed');
      status.textContent = 'Your enquiry was sent.';
      result.classList.add('sent');
      if (chatWindow) chatWindow.location.href = whatsappLink;
      if (form.dataset.thanks) {
        try {
          sessionStorage.setItem('kasavu-conversion', JSON.stringify({form:data.get('Enquiry'),chat:whatsappLink}));
          location.assign(form.dataset.thanks);
        } catch {
          // The inline confirmation remains available when browser storage is disabled.
        }
      }
    } catch {
      chatWindow?.close();
      status.textContent = 'We couldn’t send your enquiry. Try again, or copy it below.';
    } finally {
      sendButton.disabled = false;
      if (fields) fields.disabled = false;
      result.hidden = false;
    }
  });
  const fields = form.querySelector('fieldset');
  if (fields) fields.disabled = false;
});
if (!reduce.matches) {
  let busy = false;
  addEventListener('pageshow', () => { busy = false; document.body.classList.remove('leaving'); });
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href]');
    if (!link || link.target || link.hasAttribute('download') || link.origin !== location.origin || link.pathname === location.pathname) return;
    event.preventDefault();
    if (busy) return;
    busy = true;
    document.body.classList.add('leaving');
    window.setTimeout(() => location.assign(link.href), 235);
  });
}
document.querySelectorAll<HTMLElement>('[data-countdown]').forEach(count=>{
  const until=new Date(count.dataset.countdown || '').valueOf();
  const refresh=()=>{
    const seconds=Math.floor((until-Date.now())/1000);
    if(seconds<=0 || !Number.isFinite(seconds)){count.textContent='This planning window has ended';return;}
    const days=Math.floor(seconds/86400);
    const hours=Math.floor(seconds%86400/3600);
    const minutes=Math.floor(seconds%3600/60);
    count.textContent=`${days}d ${hours}h ${minutes}m`;
  };
  refresh(); setInterval(refresh,30000);
});
document.querySelectorAll<HTMLButtonElement>('[data-card-next]').forEach(button=>button.addEventListener('click',()=>{
  const photos=Array.from(button.parentElement?.querySelectorAll('img') || []);
  const showing=photos.findIndex(image=>!image.classList.contains('slide-photo'));
  photos.forEach((image,index)=>image.classList.toggle('slide-photo',index!==(showing+1)%photos.length));
}));

const marqueeToggle = document.querySelector<HTMLButtonElement>('[data-marquee-toggle]');
if (marqueeToggle) {
  marqueeToggle.hidden = reduce.matches;
  marqueeToggle.addEventListener('click', () => {
    const paused = marqueeToggle.parentElement?.classList.toggle('marquee-paused');
    marqueeToggle.textContent = paused ? 'Resume names' : 'Pause names';
  });
  reduce.addEventListener('change', event => { marqueeToggle.hidden = event.matches; });
}
