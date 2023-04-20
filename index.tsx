import React from 'react';
import { useState, useEffect, Component,ComponentType} from 'react';

var loadingMask;
//https://bugfender.com/blog/how-to-create-an-npm-package/

export function isObject(item:any) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target:any, ...sources:any):any {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

export const http:any = {
  accountService: null,
  get,
  post,
  gql,
  put,
  loadingMask,
  delete: _delete,
  onError:(request:any)=>{},
  baseHREF: '/admin/pide',
  baseURL: 'http://web.regionancash.gob.pe'
}

function scheme(url:any) {
  if (!/^(f|ht)tps?:\/\//i.test(url)) {
    return http.baseURL + url;
  } else
    return url;
}

function get(url:any, header?:any) {
  const options = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...authHeader(url, header) },
  };
  if (http.loadingMask) http.loadingMask(true);
/*
  const myPromise = new Promise(async (resolve, reject) => {
    let res;
    try{
      res=await fetch(scheme(url), options);
      
    }catch(e){
      res=res||{};
      res.error=e;
    }
    resolve(res);
  });
return myPromise;
*/


  return fetch(scheme(url), options).then(handleResponse).catch((e) => { handleError(e, { url, ...options }) });
}

function gql(url:any, body:any, header?:any) {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(url, header) },
    body: JSON.stringify(body)
  };
  if (http.loadingMask) http.loadingMask(true);
  return fetch(scheme(url), options).then((response:any) => {
    response.gql = true;
    if (http.loadingMask) http.loadingMask(false);
    return handleResponse(response);
  }).catch((e) => { handleError(e, { url, ...options }) });
}

function post(url:any, body:any, header?:any) {


  let options:any = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(url, header) },
    body: (typeof body === 'string' || body instanceof String)?body:JSON.stringify(body)
  };
  if(body instanceof FormData){
    options = {
      method: 'POST',
      headers: { ...{}, ...authHeader(url, header) },
      body: body
    };
  }
  if (http.loadingMask) http.loadingMask(true);
  return fetch(scheme(url), options).then(handleResponse).catch((e) => { handleError(e, { url, ...options }) });
}

function put(url:any, body:any) {
  const options = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader(url) },
    body: JSON.stringify(body)
  };
  if (http.loadingMask) http.loadingMask(true);
  return fetch(scheme(url), options).then(handleResponse).catch((e) => { handleError(e, { url, ...options }) });
}

// prefixed with underscored because delete is a reserved word in javascript
function _delete(url:any) {
  const options = {
    method: 'DELETE',
    headers: authHeader(url)
  };
  if (http.loadingMask) http.loadingMask(true);
  return fetch(scheme(url), options).then(handleResponse).catch((e) => { handleError(e, { url, ...options }) });
}

function authHeader(url:any, opts?:any) {
  const accountService = http.accountService;
  var header:any = {};
  if (accountService) {
    const user = accountService.getUserValue();
    const isLoggedIn = user && user.jwtToken;
    //const isApiUrl = url.startsWith(config.apiUrl);
    if (isLoggedIn /*&& isApiUrl*/)
      header.Authorization = `Bearer ${user.jwtToken}`;
  }
  if (typeof opts === 'function') {
    header = opts(header);
  } else if (opts) header = { ...header, ...opts };
  return header;
}

function handleResponse(response:any) {
  return response.text().then((text:any) => {
    if (http.loadingMask) http.loadingMask(false);
    if (!response.ok) {
      const data = text;
      const accountService = http.accountService;
      console.log(response);
console.log('response.status'+response.status);
      if ([401].includes(response.status) /*&& http.accountService.getUserValue()*/) {
        if (accountService)
          accountService.logout();
      } else if (response.status == 403) {
        alert('No esta autorizado!');
      }
      response.message = data;
      response.error = 'Error de internet!';
      if (http.onError){
        http.onError(response);
      }else
        return Promise.reject(response);
    } else {
      try {
        if (text) {
          text = JSON.parse(text);
          if (response.gql) {
            //console.log(text);
            if (text.errors) {
              response.error = text.errors.reduce(
                (previousValue:any, v:any) => (previousValue + '\n' + v.path.join('.') + ': ' + v.message).trim(),
                ''
              );
              //throw response.error;
              if (http.onError)
                http.onError(response);
              else
                return Promise.reject(response);
            } else
              text = text.data;
          }
          return text;
        } return null;
      } catch (e) {
        response.message = 'OOOO=' + text;
        response.error = e;
        if (http.onError)
          http.onError(response);
        else
          return Promise.reject(response);
      }
    }
  });
}

function handleError(error:any, response:any) {
  console.log(response);
  console.log('handleError.status'+response.status);
  if (http.loadingMask){
    //console.log('error from gra_utils ');
    http.loadingMask(false);
  }
  response.error = error;
  
  if (http.onError)
    http.onError(response);
  else
    return Promise.reject(response);
}

export function useFormState(useState:any, defaultState?:any) {
  const [o, setO] = useState(defaultState ? defaultState : {});
  const [e, setE] = useState({});
  const [required, setRequired] = useState({});
  const [onBlur, setOnBlur] = useState({});
  const [onChange, setOnChange] = useState({});

  const handleChange = (name:any, v?:any) => {
    /*console.log(name);*/
    var ee;
    if (name.target) {
      v = name;
      ee=name;
      name = name.target.name || name.target.id;
    }
    var vv = v && v.target ? (v.target.type === 'checkbox' ? v.target.checked : v.target.value) : v;
    setValue(o, name, vv);
    setO((o:any) => ({...o}
      /*{
      ...o, [name]: vv ?? ''
    }*/
    ));
    if (onChange[name]&&ee)onChange[name](ee);
    if (required[name])
      setE((e:any) => ({
        ...e, [name]: !vv
      }));
  };


  function setValue(o:any, k:any, v:any) {
    k.split('.').forEach((k:any, i:any, a:any) => {
      if (i == a.length - 1) {
        o[k] = v;
      } else {
        o = (o[k] = o[k] || {});
      }
    })
  }

  const onfocusout = (e:any) => {
    const el = e.target;
    const ob=onBlur[el.name];
    
    if (required[el.name] || el.required)
      setE((e:any) => ({
        ...e, [el.name]: !el.value
      }));
    if(ob)ob(e);
  };

  const defaultProps = function (name:any, opts?:any) {

    let v=name.split('.').reduce((o:any,e:any)=>(o?o[e]:null),o);

    let props = {
      name: name,
      onBlur: onfocusout,
      error: e[name],
      value: v||v==0?v: '',
      onChange: handleChange
    }
    required[name] = true;
    if (opts) {
      if ('onBlur' in opts) {
        onBlur[name] = opts.onBlur;
        delete opts.onBlur;
      }
      if ('onChange' in opts) {
        onChange[name] = opts.onChange;
        delete opts.onChange;
      }
      if ('required' in opts) {
        required[name] = opts.required;
      }
      props = { ...props, ...opts };
      
    }
    return props;
  }

  const bindEvents = function (form:any) {
    var list = form.querySelectorAll("input");
    for (let item of list) {
      item.addEventListener('focusout', onfocusout);
      //item.addEventListener('input', handleChange);
    }
    return () => {
      for (let item of list) {
        item.removeEventListener('focusout', onfocusout);
        //item.removeEventListener('input', handleChange);
      }
    }
  }

  const validate = function (form:any) {
    let ok = true;
    let list = form.querySelectorAll("input,textarea");
    let radio:any = {};
    for (let item of list) {
      if (required[item.name] || item.required) {
        if (item.type == 'radio') {
          //si el superior es requerid
          //console.log(item.name+' '+item.parentNode);
          radio[item.name] = radio[item.name] || item.checked;
        } else if (!item.value) {
          setE((e:any) => ({
            ...e, [item.name]: !item.value
          }));
          ok = false;
        }
      }
    }
    for (const [key, value] of Object.entries(radio)) {
      setE((e:any) => ({
        ...e, [key]: !value
      }));
      if (!value) ok = false;
    }
    return ok;
  }

  return [
    o,
    { defaultProps, handleChange, bindEvents, validate, set: setO }
  ];
}

export function debounce(fn:any, ms?:any) {
  let timer:any
  return (_:any)=>{
    /*let me:any=this;
    clearTimeout(timer)
    timer = setTimeout((_:any) => {
      timer = null;
      fn.apply(me, [window.innerWidth, window.innerHeight])
    }, ms ? ms : 200)*/
  };
}

export function useResize(React:any) {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = React.useState({
    width: undefined,
    height: undefined,
  });
  React.useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      if (windowSize.width != window.innerWidth || windowSize.height != window.innerHeight)
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
    }
    // Add event listener
    window.addEventListener("resize", handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}

export function useToken() {

  const getToken = () => {
    const tokenString = localStorage.getItem('session');
    if(!tokenString)return tokenString;
    try{
    const userToken:any = JSON.parse(tokenString);
    return userToken?.token
    }catch(e:any){return null;}
  };

  const logOut = () => {
    localStorage.removeItem('session');
    localStorage.removeItem('token');
    localStorage.removeItem('perms');
    setToken(null);
  };

  http.accountService = {
    getUserValue() {
      return { jwtToken: getToken() }
    },
    logOut
  };

  const [token, setToken0] = useState(getToken());

  const setToken = (userToken:any) => {
    localStorage.setItem('session', JSON.stringify(userToken));
    setToken0(userToken.token);
  };

  return {
    setToken,
    token,
    logOut
  }

}

export const OAuth = function ({setToken , url, redirect, client_id, oauth_url}:any) {

  const [msg, setMsg] = useState('');

  useEffect(() => {
    const location = window.location;
    let urlParams = new URLSearchParams(location.search);
    if(urlParams.get('code'))redirect(location.toString());
    //dispatch({ type: 'appUrlOpen', url:location.toString()});
  }, []);

  useEffect(() => {
    
    let location = new URL(url||window.location);
    let urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    console.log('useEffect',location);
    if (code){
      http.post('/api/auth/token', code,()=>{return {'Content-Type':'*/*'}}).then((data:any) => {
       if (data.error) {
          setMsg(JSON.stringify(data.error));
        } else if (data.access_token||data.token) {
          localStorage.setItem('perms',JSON.stringify(data.perms));
          localStorage.setItem('user_nicename',data.user_nicename);
          setToken({ token: data.access_token||data.token });
          location = new URL(window.location.toString());
          urlParams = new URLSearchParams(location.search);
          urlParams.delete('code');
          let q = urlParams.toString();
          q = q && ('?' + q);
          window.location.replace(location.protocol + '//' + location.host + location.pathname + q);
        }
      });
    }else{
      window.location.href = `${oauth_url}/authorize?response_type=code&client_id=${client_id}&scope=profile`;
    }
  }, [url]);

  return <div style={{height:'100%',textAlign:'center'}}>oauth - {url} - {msg}</div>

};

interface LazyLoaderState {
  component: ComponentType<any> | null;
}

export function lazyLoader(importComp:any){

	return class extends Component {

    state: LazyLoaderState = {
      component: null,
    };

    /*constructor(props: any) {
      super(props);
      this.state = {
        component: null,
      };
    }*/

		//loading the component and setting it to state
		componentDidMount() {
			importComp().then((comp:any) => this.setState({ component: comp.default }));
		}
    
		render() {
			const C:any = this.state.component;
			return C ? <C {...this.props} /> :<div style={{height:'100%',display:'flex',
			flexDirection: 'column',
			justifyContent: 'center'}}>Loading...</div>;
		}
	};
};

/*
const lazyLoader = (importComp: () => Promise<{ default: ComponentType<any> }>) => {
  return function LazyLoader(props: any) {
    const [component, setComponent] = useState<ComponentType<any> | null>(null);

    //loading the component and setting it to state
    useEffect(() => {
      importComp().then((comp) => setComponent(comp.default));
    }, []);

    //rendering the component
    if (!component) return null;
    const C = component;
    return <C {...props} />;
  };
};

export default lazyLoader;
*/