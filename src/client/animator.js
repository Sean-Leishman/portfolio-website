let sections = document.querySelectorAll('section');

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const text = entry.target.querySelector('.project-left')
        if (text){
            if (entry.isIntersecting){
                text.classList.add('animated');
                return;
            }
            text.classList.remove('animated')
        }
    })
});
console.log(observer)
sections.forEach((section, index) => {
    observer.observe(section);
})
