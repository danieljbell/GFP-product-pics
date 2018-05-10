const slider = tns({
  container: '.modal--body',
  items: 1,
  slideBy: 'page',
  controlsText: ['&lt;', '&gt;']
});

document.addEventListener('click', function(e) {

  console.log(e.target.name);

    if (e.target.parentElement.classList.contains('view-photo') || e.target.classList.contains('view-photo')) {
      photoBiggify(findParentBySelector(e.target, '.modal-image'));
    }

});

document.addEventListener('keydown', function(e) {
  if (e.keyCode === 27 && document.body.classList.contains('modal-open')) {
    document.body.classList.remove('modal-open');
  }
});


function photoBiggify(elem) {

  slider.goTo(elem.getAttribute('data-index'));

  document.body.classList.add('modal-open');
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('close-modal')) {
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