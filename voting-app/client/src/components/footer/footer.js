import React, {Component} from 'react';
import './footer.css';

class Footer extends Component{

    render(){
        return(
            <footer id="sticky-footer" class="py-4 bg-dark text-white-50">
                <div class="container text-center">
                    <small>Tomas Bujna &copy; Volting App</small>
                </div>
            </footer>
        );
    }
}
export default Footer;