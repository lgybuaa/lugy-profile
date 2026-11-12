(() => {
'use strict';
document.body.classList.add('js');
const storage = {get(k,d){try{return localStorage.getItem('lugy-'+k)||d;}catch(e){return d;}},set(k,v){try{localStorage.setItem('lugy-'+k,String(v));}catch(e){}}};
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#main-nav');
if(menu&&nav)menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);menu.textContent=open?'收起':'菜单';});
const progress=document.querySelector('.reading-progress');let scheduled=false;
function updateProgress(){const height=document.documentElement.scrollHeight-innerHeight;progress.style.width=(height>0?Math.min(100,scrollY/height*100):0)+'%';scheduled=false;}
if(progress){addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateProgress);}},{passive:true});addEventListener('resize',updateProgress);updateProgress();}
const marquee = document.querySelector('.marquee');
if (marquee) {
  const track = marquee.querySelector('.marquee-track');
  const group = track.querySelector('.marquee-group');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pixelsPerSecond = 42;

  function updateMarquee() {
    if (reducedMotion.matches) {
      marquee.classList.remove('is-running');
      track.querySelectorAll('[aria-hidden="true"].marquee-group').forEach(copy => copy.remove());
      return;
    }

    marquee.classList.add('is-running');
    const cycleWidth = group.getBoundingClientRect().width;
    if (!cycleWidth) return;

    const groupCount = Math.ceil(marquee.clientWidth / cycleWidth) + 1;
    while (track.children.length > groupCount) track.lastElementChild.remove();
    while (track.children.length < groupCount) {
      const copy = group.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.append(copy);
    }
    track.style.setProperty('--marquee-distance', -cycleWidth + 'px');
    track.style.setProperty('--marquee-duration', cycleWidth / pixelsPerSecond + 's');
  }

  const observer = new ResizeObserver(updateMarquee);
  observer.observe(marquee);
  observer.observe(group);
  reducedMotion.addEventListener('change', updateMarquee);
  updateMarquee();
}
const print=document.querySelector('#print-resume');if(print)print.addEventListener('click',()=>window.print());
if(document.body.dataset.page!=='playground')return;
const board=document.querySelector('#memory-board'),memoryStatus=document.querySelector('#memory-score'),pauseButton=document.querySelector('#memory-pause'),memoryResult=document.querySelector('#memory-result');
let cards=[],selected=[],pairs=0,moves=0,elapsed=0,startTime=0,running=false,paused=false,raf=0,lastDisplay=-1,lock=false,gameGeneration=0,hideTimer=0,hideDue=0,hideRemaining=0;
function clearHideTimer(){clearTimeout(hideTimer);hideTimer=0;}
function scheduleHide(){if(!lock||paused)return;const gen=gameGeneration;hideDue=performance.now()+hideRemaining;hideTimer=setTimeout(()=>{hideTimer=0;if(gen!==gameGeneration||paused)return;for(const j of selected){board.children[j].classList.remove('flipped');board.children[j].setAttribute('aria-label','第 '+(j+1)+' 张牌，未翻开');}selected=[];lock=false;hideRemaining=0;},hideRemaining);}
const points=[[14,30],[43,10],[70,33],[58,67],[22,64]];
const edgeSets=[[[0,1],[1,2],[2,3],[3,4],[4,0]],[[0,1],[0,2],[0,3],[0,4]],[[0,1],[1,2],[2,3],[3,4]],[[0,1],[1,2],[2,0],[2,3],[3,4]],[[0,1],[0,4],[1,4],[1,2],[2,3],[3,4]],[[0,2],[0,3],[1,3],[1,4],[2,4]]];
function shape(n){return '<svg class="shape" viewBox="0 0 84 80" aria-hidden="true">'+edgeSets[n].map(([a,b])=>'<line x1="'+points[a][0]+'" y1="'+points[a][1]+'" x2="'+points[b][0]+'" y2="'+points[b][1]+'" stroke="currentColor" stroke-width="2"/>').join('')+points.map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="5" fill="currentColor"/>').join('')+'</svg>';}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function seconds(){return Math.floor((elapsed+(running&&!paused?performance.now()-startTime:0))/1000);}
function status(){const best=storage.get('memory-best','');memoryStatus.textContent='配对 '+pairs+'/6 · 翻牌 '+moves+' 次 · '+seconds()+' 秒'+(best?' · 最佳 '+best+' 次':'')+(paused?' · 已暂停':'');}
function tick(){if(!running||paused)return;if(seconds()!==lastDisplay){lastDisplay=seconds();status();}raf=requestAnimationFrame(tick);}
function stopClock(){if(running&&!paused)elapsed+=performance.now()-startTime;cancelAnimationFrame(raf);raf=0;}
function renderBoard(){board.replaceChildren();cards.forEach((type,i)=>{const b=document.createElement('button');b.className='memory-card';b.type='button';b.setAttribute('aria-label','第 '+(i+1)+' 张牌，未翻开');b.innerHTML='<span class="back-label" aria-hidden="true">?</span>'+shape(type);b.addEventListener('click',()=>flip(i));board.append(b);});}
function startMemory(){stopClock();clearHideTimer();hideRemaining=0;gameGeneration++;cards=shuffle([...Array(6).keys(),...Array(6).keys()]);selected=[];pairs=0;moves=0;elapsed=0;lastDisplay=-1;running=true;paused=false;lock=false;startTime=performance.now();pauseButton.disabled=false;pauseButton.textContent='暂停';board.classList.remove('is-paused');memoryResult.hidden=true;memoryResult.replaceChildren();renderBoard();status();tick();}
function setPaused(value){if(!running||paused===value)return;if(value){stopClock();if(hideTimer){hideRemaining=Math.max(0,hideDue-performance.now());clearHideTimer();}paused=true;}else{paused=false;startTime=performance.now();scheduleHide();tick();}pauseButton.textContent=paused?'继续':'暂停';board.classList.toggle('is-paused',paused);status();}
function flip(i){if(!running||paused||lock)return;const b=board.children[i];if(b.classList.contains('flipped')||b.classList.contains('matched'))return;b.classList.add('flipped');b.setAttribute('aria-label','第 '+(i+1)+' 张牌，图形 '+(cards[i]+1));selected.push(i);if(selected.length<2)return;moves++;status();const [a,c]=selected;if(cards[a]===cards[c]){board.children[a].classList.add('matched');b.classList.add('matched');board.children[a].disabled=true;b.disabled=true;selected=[];pairs++;status();if(pairs===6)finishMemory();}else{lock=true;hideRemaining=800;scheduleHide();}}
function finishMemory(){stopClock();running=false;paused=false;pauseButton.disabled=true;const prev=Number(storage.get('memory-best','999'));if(moves<prev)storage.set('memory-best',moves);status();memoryResult.hidden=false;memoryResult.textContent='全部配对完成！本局 '+moves+' 次翻牌、'+seconds()+' 秒；最佳 '+storage.get('memory-best',moves)+' 次。';const b=document.createElement('button');b.className='button primary';b.textContent='再来一局';b.addEventListener('click',startMemory);memoryResult.append(document.createElement('br'),b);}
document.querySelector('#memory-start').addEventListener('click',startMemory);pauseButton.addEventListener('click',()=>setPaused(!paused));document.addEventListener('visibilitychange',()=>{if(document.hidden){setPaused(true);document.body.classList.add('motion-paused');}});
const maps=[[[0,1],[0,2],[1,3],[2,4],[3,5],[4,5],[1,4]],[[0,1],[1,2],[2,5],[0,3],[3,4],[4,5],[1,4]],[[0,2],[2,3],[3,5],[0,1],[1,4],[4,3],[2,4]],[[0,1],[1,3],[3,4],[4,5],[0,2],[2,4],[1,2]],[[0,3],[3,1],[1,5],[0,2],[2,4],[4,1],[4,5]]];
const coords=[[40,110],[145,35],[145,185],[270,45],[270,175],[380,110]];let level=0,path=[0],won=false;
const pathStatus=document.querySelector('#path-status'),pathGraph=document.querySelector('#path-graph'),pathControls=document.querySelector('#path-controls'),pathResult=document.querySelector('#path-result');
function neighbors(v){return maps[level].filter(([a,b])=>a===v||b===v).map(([a,b])=>a===v?b:a);}
function shortest(){const queue=[[0,0]],seen=new Set([0]);while(queue.length){const [v,d]=queue.shift();if(v===5)return d;for(const n of neighbors(v))if(!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}return 0;}
function choose(n){if(won)return;const current=path[path.length-1];if(!neighbors(current).includes(n)){pathStatus.textContent='这两个节点没有连线，请选择当前节点的相邻节点。';return;}path.push(n);if(n===5){won=true;const d=path.length-1,optimal=shortest();if(d===optimal){const highest=Math.max(Number(storage.get('path-best','0')),level+1);storage.set('path-best',highest);}pathResult.hidden=false;pathResult.textContent='抵达 F：本局 '+d+' 步，最短 '+optimal+' 步。'+(d===optimal?'你找到了最短路径！':'可以重走一次，试试更短的路线。')+' 最佳记录：第 '+storage.get('path-best','0')+' 关最短通关。';}renderPath();}
function renderPath(){const current=path[path.length-1];pathStatus.textContent='第 '+(level+1)+'/5 关 · '+path.map(x=>'ABCDEF'[x]).join(' → ')+' · '+(path.length-1)+' 步';pathGraph.innerHTML='<svg viewBox="0 0 420 220" role="img" aria-label="节点 A 到 F 的路径地图">'+maps[level].map(([a,b])=>'<line x1="'+coords[a][0]+'" y1="'+coords[a][1]+'" x2="'+coords[b][0]+'" y2="'+coords[b][1]+'" stroke="var(--muted)" stroke-width="2"/>').join('')+coords.map(([x,y],n)=>'<g class="node '+(path.includes(n)?'visited ':'')+(n===current?'current':'')+'" data-node="'+n+'"><circle cx="'+x+'" cy="'+y+'" r="24"/><text x="'+x+'" y="'+(y+6)+'" text-anchor="middle" font-size="20">'+'ABCDEF'[n]+'</text></g>').join('')+'</svg>';pathGraph.querySelectorAll('[data-node]').forEach(g=>g.addEventListener('click',()=>choose(Number(g.dataset.node))));pathControls.replaceChildren();for(let n=0;n<6;n++){const b=document.createElement('button');b.textContent='ABCDEF'[n];b.setAttribute('aria-label','前往节点 '+'ABCDEF'[n]);b.className=n===current?'current':'';b.disabled=won||n===current||!neighbors(current).includes(n);b.addEventListener('click',()=>choose(n));pathControls.append(b);}}
function resetPath(){path=[0];won=false;pathResult.hidden=true;renderPath();}
document.querySelector('#path-reset').addEventListener('click',resetPath);document.querySelector('#path-next').addEventListener('click',()=>{level=(level+1)%maps.length;resetPath();});renderPath();
const tabs=[...document.querySelectorAll('[data-game]')];function selectGame(t){tabs.forEach(x=>{x.setAttribute('aria-selected',String(x===t));x.tabIndex=x===t?0:-1;document.querySelector('#'+x.getAttribute('aria-controls')).hidden=x!==t;});if(t.dataset.game!=='memory')setPaused(true);}
tabs.forEach((t,i)=>{t.tabIndex=i===0?0:-1;t.addEventListener('click',()=>selectGame(t));t.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;selectGame(tabs[next]);tabs[next].focus();});});
})();
