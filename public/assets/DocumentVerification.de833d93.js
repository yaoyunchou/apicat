import{g as m,f as _}from"./element-plus.33434d3d.js";import{b as d,ah as f,ab as a,_ as p}from"./index.0b92b67b.js";import{_ as u}from"./img_join.8db8ddd5.js";import{q as h,o as g,e as k,f as e,Y as i,W as C,ab as y}from"./vendor.1b70e788.js";const E={name:"DocumentVerification",inject:["showHeader"],data(){return{isLoading:!1,form:{doc_id:this.$route.params.doc_id||"",secret_key:""}}},methods:{onSubmitBtnClick(){this.isLoading=!0,f(this.form).then(o=>{a.set(a.KEYS.SECRET_DOCUMENT_TOKEN+this.form.doc_id,o.data||"",!0),location.href=`/doc/${this.form.doc_id}`}).finally(()=>{this.isLoading=!1})}},setup(){h("showHeader")(!1)}},V={class:"ac-verification"},b={class:"ac-verification__main"},w=e("span",{class:"logo large"},[e("img",{src:p,alt:"ApiCat"}),e("span",{class:"logo-text logo-apicat mt-0"},"ApiCat")],-1),x=y("\u7EE7\u7EED\u8BBF\u95EE"),B=e("img",{src:u,class:"mt-9 w-full"},null,-1);function S(o,s,N,v,t,n){const c=m,r=_;return g(),k("main",V,[e("div",b,[w,i(c,{class:"my-7 w-1/2",modelValue:t.form.secret_key,"onUpdate:modelValue":s[0]||(s[0]=l=>t.form.secret_key=l),placeholder:"\u8BBF\u95EE\u5BC6\u7801",maxlength:"6",clearable:""},null,8,["modelValue"]),i(r,{loading:t.isLoading,type:"primary",onClick:n.onSubmitBtnClick},{default:C(()=>[x]),_:1},8,["loading","onClick"]),B])])}var K=d(E,[["render",S]]);export{K as default};