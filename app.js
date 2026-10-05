const people = [
  { name: '김민수', office: '본관 2층 교무실', extension: '231' },
  { name: '최유진', office: '별관 교무실', extension: '412' },
  { name: '박지훈', office: '본관 2층 교무실', extension: '232' },
  { name: '이서연', office: '1학년 교무실', extension: '311' },
  { name: '정하늘', office: '행정실', extension: '105' },
  { name: '한지우', office: '보건실', extension: '501' },
];
const normalize = value => value.trim().normalize('NFC').toLocaleLowerCase('ko-KR');
const collator = new Intl.Collator('ko-KR');
const input = document.querySelector('#demo-search');
const results = document.querySelector('#demo-results');
const status = document.querySelector('#demo-status');
function renderResults() {
  const query = normalize(input.value);
  const ranked = query ? people.map(person => {
    const name = normalize(person.name), office = normalize(person.office), extension = normalize(person.extension);
    const rank = extension === query ? 0 : name === query ? 1 : office === query ? 2 : name.includes(query) ? 3 : office.includes(query) ? 4 : extension.includes(query) ? 5 : -1;
    return { ...person, rank };
  }).filter(person => person.rank >= 0).sort((a, b) => a.rank - b.rank || collator.compare(a.name, b.name) || collator.compare(a.office, b.office) || collator.compare(a.extension, b.extension)) : [];
  results.replaceChildren();
  if (!ranked.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-result';
    empty.textContent = query ? '검색 결과가 없어요. 예시 이름이나 교무실로 찾아보세요.' : '이름, 교무실 또는 내선번호를 입력해 보세요.';
    results.append(empty);
  }
  for (const person of ranked) {
    const row = document.createElement('li');
    for (const [tag, text] of [['strong', person.name], ['span', person.office], ['b', person.extension]]) {
      const el = document.createElement(tag); el.textContent = text; row.append(el);
    }
    results.append(row);
  }
  status.textContent = query ? `${ranked.length}명 찾았어요` : '가상 명단 6명으로 체험 중';
}
input.addEventListener('input', renderResults);
function reopen() {
  document.querySelector('#demo-body').hidden = false;
  document.querySelector('#demo-closed').hidden = true;
  input.focus({ preventScroll: true });
}
document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => {
  reopen(); input.value = button.dataset.query; renderResults();
}));
input.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  document.querySelector('#demo-body').hidden = true;
  document.querySelector('#demo-closed').hidden = false;
  document.querySelector('#reopen-demo').focus({ preventScroll: true });
});
document.querySelector('#reopen-demo').addEventListener('click', reopen);
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab, focus = false) {
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    item.classList.toggle('active', selected);
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  }
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault(); selectTab(tabs[next], true);
  });
});
if (/Android|iPhone|iPad|Macintosh/i.test(navigator.userAgent)) document.querySelector('#platform-note').hidden = false;
renderResults();
