
<div class="bg-loading">
    <div class="loading">
        <div class="spinner"></div>
    </div>
</div>

<style>
    .bg-loading {
    background: #00000030;
    width: 100%;
    height: 100%;
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 3;
}
.loading {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-46%,-70%);
    width: 100px;
    height: 100px;
    line-height: 100px;
    text-align: center;
    background: #ebaa34;
    color: white;
    z-index: 3;
    border-radius: 50%;
}

.spinner {
   width: 60px;
   height: 60px;
   border-radius: 50%;
   background: radial-gradient(farthest-side,#ffffff 94%,#0000) top/9px 9px no-repeat,
          conic-gradient(#0000 30%,#ffffff);
   -webkit-mask: radial-gradient(farthest-side,#0000 calc(100% - 9px),#000 0);
   animation: spinner-c7wet2 0.8s infinite linear;
}
.spinner {
    margin: 0 auto;
    top: 19px;
    display: block;
    position: relative;
}
@keyframes spinner-c7wet2 {
   100% {
      transform: rotate(1turn);
   }
}
</style>