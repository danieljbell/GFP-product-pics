const video = document.querySelector('.player');
const canvas = document.querySelector('.photo');
const ctx = canvas.getContext('2d');
const strip = document.querySelector('.strip');

const modalBody = document.querySelector('.modal--body');

const photos = [];

let index = 0;

document.addEventListener('click', function(e) {
    
    if (e.target.id === 'takePhoto') {
      e.preventDefault();
      takePhoto();
    }
    
    if (e.target.parentElement.classList.contains('view-photo') || e.target.classList.contains('view-photo')) {
      e.preventDefault();
      photoBiggify(findParentBySelector(e.target, '.modal-image'));
    }

    if (e.target.parentElement.classList.contains('delete-photo') || e.target.classList.contains('delete-photo')) {
      e.preventDefault();
      const imgSelector = findParentBySelector(e.target, '.modal-image');
      imgSelector.previousElementSibling.remove();
      imgSelector.remove();
    }

    if (e.target.id === 'delete-product') {
      e.preventDefault();
      e.target.classList.add('confirm-delete');
      document.body.classList.add('delete-open');
    }

    if (e.target.id === 'no-delete') {
      e.preventDefault();
      findParentBySelector(e.target, '.site-width').querySelector('#delete-product').classList.remove('confirm-delete');
      document.body.classList.remove('delete-open');
    }

});

document.addEventListener('keydown', function(e) {
  if (e.keyCode === 27 && document.body.classList.contains('modal-open')) {
    document.querySelector('.modal--body').innerHTML = '';
    document.body.classList.remove('modal-open');
  }
});

getVideo();

video.addEventListener('canplay', paintToCanvas);


function getVideo() {
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(localMediaStream => {
      video.src = window.URL.createObjectURL(localMediaStream);
      video.play();
    })
    .catch(err => {
      console.error(`OH NO!!!`, err);
    });
}

function paintToCanvas() {
  const width = video.videoWidth;
  const height = video.videoHeight;
  canvas.width = width;
  canvas.height = height;

  return setInterval(() => {
    ctx.drawImage(video, 0, 0, width, height);
  }, 16);
}

function takePhoto(i) {
  const data = canvas.toDataURL('image/jpeg');
  const input = document.createElement('input');
  const div = document.createElement('div');
  index++;
  input.name = 'product_image';
  input.type = 'hidden';
  input.value = data;
  div.classList.add('modal-image');
  div.setAttribute('data-index', index);
  div.innerHTML = `
    <img src=${data}>
    <ul class="photo-actions">
      <li>
        <button class="view-photo"><img src="/images/icons/search.svg"><span>Zoom</span></button>
      </li>
      <li>
        <button class="delete-photo"><img src="/images/icons/delete.svg"><span>Delete</span></button>
      </li>
    </ul>
  `;
  strip.appendChild(div, strip.firstChild);
  strip.appendChild(input, strip.firstChild);
  photos.push(`<img src=${data}>`);
}

function photoBiggify(elem) {
  const img = elem.querySelector('img');
  const modalContainer = document.querySelector('.modal');

  modalContainer.querySelector('.modal--body').innerHTML = '';

  photos.forEach(function(photo) {
    modalBody.innerHTML += photo
  });

  const slider = tns({
    container: '.modal--body',
    items: 1,
    slideBy: 'page',
    controlsText: ['&lt;', '&gt;']
  });

  slider.goTo(elem.getAttribute('data-index'));

  document.body.classList.add('modal-open');

  // modalContainer.querySelector('.modal--body').innerHTML = `<img src="${img.src}">`;
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('close-modal')) {
      slider.destroy();
      modalContainer.querySelector('.modal--body').innerHTML = '';
      document.body.classList.remove('modal-open');
    }
  });
}

function collectionHas(a, b) { //helper function (see below)
    for(var i = 0, len = a.length; i < len; i ++) {
        if(a[i] == b) return true;
    }
    return false;
}
function findParentBySelector(elm, selector) {
    var all = document.querySelectorAll(selector);
    var cur = elm.parentNode;
    while(cur && !collectionHas(all, cur)) { //keep going up until you find a match
        cur = cur.parentNode; //go up
    }
    return cur; //will return null if not found
}

